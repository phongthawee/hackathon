import { defineEventHandler, readBody } from 'h3';
import fs from 'fs';
import path from 'path';

// Re-import the mapping and calculation logic to construct the stats summary context
const hospitalToCity: Record<string, string> = {
  'Chiang Mai Ram': 'Chiang Mai',
  'Phuket International': 'Phuket',
  'Bangkok General': 'Bangkok',
  'Siriraj': 'Bangkok',
  'Bumrungrad': 'Bangkok',
  'Thonburi Hospital': 'Bangkok',
  'Samitivej': 'Bangkok',
  'Siam Medical': 'Bangkok',
  'Central Health': 'Chon Buri',
  'City Hospital': 'Khon Kaen'
};

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const userMessage = body?.message || 'ช่วยสรุปภาพรวมสถานการณ์โรคระบาดในเดือนนี้ให้หน่อย';
  const isAutoSummary = body?.isAutoSummary || false;
  const isSpreadsheetAnalysis = body?.isSpreadsheetAnalysis || false;
  const sheetData = body?.sheetData || '';

  const dataDir = path.resolve(process.cwd(), 'server/data');

  try {
    // 1. Gather stats data to inject as context
    const appointmentsRaw = JSON.parse(fs.readFileSync(path.join(dataDir, 'appointments.json'), 'utf-8'));
    const doctors = JSON.parse(fs.readFileSync(path.join(dataDir, 'doctors.json'), 'utf-8'));
    
    const docMap = new Map();
    doctors.forEach((doc: any) => docMap.set(doc.doctor_id, doc));

    const cityStats: Record<string, { count: number; symptoms: Record<string, number> }> = {
      'Bangkok': { count: 0, symptoms: {} },
      'Chiang Mai': { count: 0, symptoms: {} },
      'Phuket': { count: 0, symptoms: {} },
      'Khon Kaen': { count: 0, symptoms: {} },
      'Chon Buri': { count: 0, symptoms: {} }
    };

    let totalNoShows = 0;
    appointmentsRaw.forEach((apt: any) => {
      if (apt.status === 'NO_SHOW') totalNoShows++;
      const doc = docMap.get(apt.doctor_id);
      if (doc) {
        const city = hospitalToCity[doc.hospital] || 'Bangkok';
        if (cityStats[city]) {
          cityStats[city].count++;
          cityStats[city].symptoms[apt.symptom] = (cityStats[city].symptoms[apt.symptom] || 0) + 1;
        }
      }
    });

    const activeOutbreakSummary = Object.entries(cityStats)
      .map(([city, data]) => {
        const topSymptoms = Object.entries(data.symptoms)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
          .map(([sym, count]) => `${sym} (${count} เคส)`)
          .join(', ');
        return `- ${city}: เคสทั้งหมด ${data.count} ราย, อาการหลักคือ ${topSymptoms || 'ไม่มี'}`;
      })
      .join('\n');

    const noShowRate = ((totalNoShows / appointmentsRaw.length) * 100).toFixed(1);

    // 2. Formulate context prompt for Gemini
    const statsContext = `
[สรุปสถิติสถานการณ์สาธารณสุข - Health Radar ณ วันที่ 13 มิถุนายน 2026]
- เคสบันทึกในระบบทั้งหมด: ${appointmentsRaw.length} เคส
- อัตราคนไข้เบี้ยวนัด (No-Show Rate): ${noShowRate}%
- การกระจายความเสี่ยงระดับภูมิภาค:
${activeOutbreakSummary}

หมายเหตุ: 
- ในเชียงใหม่ กำลังมีการแพร่ระบาดของ Flu symptoms (ไข้หวัดใหญ่) และ Sore throat (เจ็บคอ) พุ่งสูงขึ้นผิดปกติในช่วงต้นเดือนมิถุนายน 2026 (มีผู้ป่วยมากกว่า 50 เคสภายใน 10 วัน)
- ในภูเก็ต มีรายงานเคสอาหารเป็นพิษ (Food Poisoning) และท้องเสีย (Diarrhea) อย่างต่อเนื่องในกลุ่มนักท่องเที่ยว
- ในกรุงเทพฯ มีแนวโน้มเคส Dengue Fever (ไข้เลือดออก) และ Covid-19 สูงขึ้น
`;

    let fullPrompt = '';

    if (isSpreadsheetAnalysis) {
      const systemInstruction = `คุณคือ "ระบบ AI ประมวลผลข้อมูลสุขภาพเชิงพื้นที่ขั้นสูง" มีหน้าที่รับข้อมูลดิบในรูปแบบตารางซีต (Spreadsheet / CSV Data) ที่ส่งเข้ามาเพื่อทำการวิเคราะห์โรครายบุคคล ตรวจสอบพฤติกรรมการระบาดในแต่ละพื้นที่ และให้แนวทางการป้องกันภาพรวม

### คำชี้แจงในการตอบกลับ (Strict Output Format Constraints)
1. ตอบกลับเป็นภาษาไทย และจัดเตรียมรายงานตามโครงสร้างด้านล่างนี้ทันที โดยเริ่มต้นที่หัวข้อ "#### ส่วนที่ 1:"
2. **ห้ามกล่าวคำทักทาย ห้ามเกริ่นนำ หรือพูดคุยสรุปปิดท้ายใดๆ ทั้งสิ้น** ให้แสดงรายงานสรุปทันที เพื่อความคลีนและตรงประเด็น
3. ในส่วนที่ 1 ต้องแสดงผลลัพธ์เป็น **ตารางสรุปในรูปแบบ Markdown Table เท่านั้น** โดยใช้โครงสร้างคอลัมน์ดังนี้:
   | Patient_ID | Predicted Disease | Confidence Level | Disease Stage / Urgency |
   |------------|-------------------|------------------|-------------------------|
4. ในคอลัมน์ Disease Stage / Urgency ให้แสดงระดับความรุนแรงและแนวทางปฏิบัติเป็นคำว่า:
   - Green (เฝ้าระวังตัวที่บ้าน...)
   - Yellow (ควรพบแพทย์...)
   - Red (อันตรายวิกฤตต้องเข้าโรงพยาบาลทันที...)
5. ในส่วนที่ 2 (สรุป Insight ความเสี่ยงเชิงพื้นที่) ให้วิเคราะห์ตำบล/พื้นที่ที่หนาแน่นเป็นพิเศษ และกลุ่มอาการระบาด
6. ในส่วนที่ 3 (แผนการป้องกันและการรับมือของชุมชน) ให้คำแนะนำแก่เจ้าหน้าที่ในพื้นที่นั้นๆ
7. เติม Medical Disclaimer ท้ายรายงานเสมอ โดยใช้รูปแบบ Markdown italic: *Medical Disclaimer: การประเมินความเสี่ยงและคัดกรองระบาดวิทยาเบื้องต้นด้วย AI จากข้อมูลในซีตเท่านั้น ไม่สามารถใช้ทดแทนการตรวจสอบทางห้องปฏิบัติการ (Lab) หรือการวินิจฉัยทางการแพทย์อย่างเป็นทางการได้*

### รายละเอียดสิ่งที่ต้องการให้วิเคราะห์:
**ส่วนที่ 1: ตารางผลลัพธ์การวินิจฉัยรายบุคคล (Individual Diagnosis Table)**
- วิเคราะห์ข้อมูลผู้ป่วยแต่ละราย (Patient_ID) หาโรคที่น่าจะเป็นมากที่สุด (Predicted Disease) ระดับความมั่นใจ (Confidence Level: High/Medium/Low) และระดับความเร่งด่วนตามเกณฑ์ด้านบน

**ส่วนที่ 2: สรุป Insight ความเสี่ยงเชิงพื้นที่ (Spatial Clustering & Epidemic Analysis)**
- วิเคราะห์ตำบล/อำเภอที่มีความหนาแน่นของผู้ป่วยเป็นพิเศษ (Cluster) พร้อมความเสี่ยงการระบาดของโรคเฉพาะถิ่น

**ส่วนที่ 3: แผนการป้องกันและการรับมือของชุมชน (Community Action Plan)**
- มาตรการรับมือสำหรับพื้นที่ที่มีสถิติผู้ป่วยสะสมสูงสุดในซีต`;

      fullPrompt = `${systemInstruction}\n\nข้อมูลตารางซีตของคนไข้ที่ผู้ใช้อัปโหลด (Input Data Table):\n${sheetData}\n\nคำสั่ง: กรุณาวิเคราะห์ข้อมูลด้านบนและเขียนรายงานสรุปทันทีตามข้อกำหนดและโครงสร้างข้างต้น`;
    } else {
      const systemInstruction = `คุณคือ "AI Outbreak Analyst" นักระบาดวิทยาและนักวิเคราะห์ข้อมูลโรคระบาดอัจฉริยะ 
ใช้ข้อมูลสรุปทางสถิติด้านสาธารณสุขของประเทศไทยที่ให้มาเพื่อตอบคำถามของผู้ใช้งาน
กติกาการตอบ:
1. ตอบเป็นภาษาไทยอย่างเป็นมืออาชีพ สุภาพ กระชับ และเข้าใจง่าย
2. หากเป็นคำขอสรุปอัตโนมัติ (isAutoSummary: true) ให้ตอบสรุปความยาวไม่เกิน 2-3 บรรทัด เน้นเตือนภัยด่วน
3. มีการเน้นข้อความสำคัญ เช่น ตัวเลข หรือชื่อโรค เพื่อให้อ่านง่าย
4. แนะนำวิธีรับมือในเชิงระบาดวิทยาเบื้องต้นด้วย`;

      fullPrompt = `${systemInstruction}\n\nบริบทสถิติล่าสุด:\n${statsContext}\n\nคำถามผู้ใช้/คำสั่ง: ${userMessage}`;
    }

    // 3. Invoke Gemini API
    let apiKey = process.env.GEMINI_API_KEY || process.env.NUXT_GEMINI_API_KEY || '';

    if (!apiKey) {
      try {
        const pathsToTry = [
          path.resolve(process.cwd(), '.env'),
          path.resolve(process.cwd(), '../.env'),
          path.resolve(process.cwd(), 'frontend_AI/.env')
        ];
        for (const p of pathsToTry) {
          if (fs.existsSync(p)) {
            const content = fs.readFileSync(p, 'utf-8');
            const match = content.match(/^GEMINI_API_KEY\s*=\s*(.*)$/m);
            if (match && match[1]) {
              apiKey = match[1].trim().replace(/^["']|["']$/g, '');
              break;
            }
          }
        }
      } catch (err) {
        console.error('Error reading fallback .env files:', err);
      }
    }

    if (!apiKey) {
      console.warn('GEMINI_API_KEY is missing. Utilizing mock response generator.');
      return {
        success: true,
        response: getMockResponse(userMessage, isAutoSummary, statsContext, isSpreadsheetAnalysis),
        isMock: true
      };
    }

    const modelsToTry = ['gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-2.0-flash'];
    let response: any = null;
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: fullPrompt }]
                }
              ]
            })
          }
        );
        if (res.ok) {
          response = res;
          break;
        } else {
          const errText = await res.text();
          console.warn(`Failed to call Gemini model ${model}:`, errText);
          lastError = new Error(`Gemini API HTTP Error ${res.status}: ${errText}`);
        }
      } catch (err: any) {
        console.warn(`Error calling model ${model}:`, err);
        lastError = err;
      }
    }

    if (!response) {
      throw lastError || new Error('All Gemini models failed to respond.');
    }

    const resData = await response.json();
    const generatedText = resData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      success: true,
      response: generatedText,
      isMock: false
    };

  } catch (error: any) {
    console.error('API Analyst error, generating fallback mock response:', error);
    return {
      success: true,
      response: getMockResponse(userMessage, isAutoSummary, '', isSpreadsheetAnalysis),
      isMock: true,
      error: error.message
    };
  }
});

// A localized mock responder mimicking the Gemini analyst in case of offline/no-key usage
function getMockResponse(query: string, isAuto: boolean, context: string, isSpreadsheetAnalysis: boolean = false): string {
  const queryLower = query.toLowerCase();
  
  if (isSpreadsheetAnalysis) {
    return `### รายงานการวิเคราะห์ระบบสุขภาพเชิงพื้นที่เชิงลึก (AI Spatial Health Report)

#### ส่วนที่ 1: ตารางผลลัพธ์การวินิจฉัยรายบุคคล (Individual Diagnosis Table)
| Patient_ID | Predicted Disease | Confidence Level | Disease Stage / Urgency |
|------------|-------------------|------------------|-------------------------|
| P001       | ไข้เลือดออก (Dengue Fever) | High | Yellow (ควรพบแพทย์เพื่อเจาะเลือดตรวจซ้ำ) |
| P002       | โควิด-19 (COVID-19) | High | Yellow (แนะนำกักตัวและแยกของใช้ส่วนตัว) |
| P003       | ไข้หวัดใหญ่ (Influenza) | Medium | Green (เฝ้าระวังอาการที่บ้าน ทานยาลดไข้พารา) |
| P004       | ไข้ปวดข้อยุงลาย (Chikungunya) | High | Red (อาการปวดข้อกระดูกรุนแรง ควรพบแพทย์ทันที) |

#### ส่วนที่ 2: สรุป Insight ความเสี่ยงเชิงพื้นที่ (Spatial Clustering & Epidemic Analysis)
*   **คลัสเตอร์ความเสี่ยงโรคติดต่อจากยุงลาย (ตำบลขามเรียง อำเภอกันทรวิชัย):** พบผู้ป่วย 2 รายในพื้นที่ตำบลขามเรียง มีอาการตรงกับไข้เลือดออก (P001) และชิคุนกุนยา (P004) สันนิษฐานว่ามีแหล่งน้ำขังหรือพาหะนำโรคชุกชุมในชุมชนนี้
*   **การเฝ้าระวังโรคทางเดินหายใจ (ตำบลท่าขอนยาง & ตลาด):** พบเคสอาการไอ ลิ้นไม่รับรส (โควิด-19) และไข้หวัดทั่วไปแบบกลุ่มย่อย จำเป็นต้องเฝ้าระวังความแออัดในพื้นที่ชุมชนและโรงเรียน

#### ส่วนที่ 3: แผนการป้องกันและการรับมือของชุมชน (Community Action Plan)
1.  **มาตรการจำกัดแหล่งเพาะพันธุ์พาหะ (ตำบลขามเรียง):** รณรงค์ทำความสะอาดชุมชน เทน้ำขังในภาชนะ แจกทรายอะเบทใส่โอ่งน้ำ และพ่นสารเคมีกำจัดยุงลายตัวแก่
2.  **มาตรการคุมเข้มการแพร่เชื้อทางเดินหายใจ (ตำบลท่าขอนยาง & ตลาด):** ประสานงาน อสม. แนะนำผู้ป่วยที่มีอาการไอ/มีไข้ต่ำ ให้สวมหน้ากากอนามัย และแยกสังเกตอาการ
3.  **การจัดเตรียมเวชภัณฑ์:** เตรียมชุดตรวจคัดกรอง ATK, ยาพาราเซตามอล, และเกลือแร่ (ORS) ให้พร้อมบริการ ณ รพ.สต. ในพื้นที่

---
*Medical Disclaimer: การประเมินความเสี่ยงและคัดกรองระบาดวิทยาเบื้องต้นด้วย AI จากข้อมูลในซีตเท่านั้น ไม่สามารถใช้ทดแทนการตรวจสอบทางห้องปฏิบัติการ (Lab) หรือการวินิจฉัยทางการแพทย์อย่างเป็นทางการได้*`;
  }
  
  if (isAuto) {
    return `🚨 **การเตือนภัยทางระบาดวิทยาปัจจุบัน (ระดับสีเหลือง):** พบผู้ป่วยอาการ **ไข้หวัดใหญ่ (Flu symptoms)** พุ่งสูงขึ้นผิดปกติอย่างมีนัยสำคัญในเขตพื้นที่ **เชียงใหม่** (เพิ่มขึ้น 40% ใน 7 วันล่าสุด) และพบเคส **อาหารเป็นพิษ (Food Poisoning)** ต่อเนื่องในเขตท่องเที่ยว **ภูเก็ต** โปรดเฝ้าระวังอย่างใกล้ชิด`;
  }

  if (queryLower.includes('เชียงใหม่') || queryLower.includes('flu') || queryLower.includes('หวัด')) {
    return `📌 **บทวิเคราะห์คลัสเตอร์จังหวัดเชียงใหม่:**
ขณะนี้พบการระบาดของกลุ่มอาการ **Flu symptoms (ไข้หวัดใหญ่)** และ **Sore throat (เจ็บคอ)** อย่างมีนัยสำคัญทางสถิติในเชียงใหม่ โดยเริ่มระบาดรุนแรงตั้งแต่ช่วงต้นเดือนมิถุนายน 2026 

**ข้อแนะนำสำหรับพื้นที่เชียงใหม่:**
1. ประสานงานโรงเรียนและสถานที่สาธารณะให้ทำความสะอาดและตั้งจุดคัดกรองอุณหภูมิ
2. ให้แอดมินคลินิกเตรียมสำรองวัคซีนไข้หวัดใหญ่และยารักษาโรคระบบทางเดินหายใจ
3. แนะนำให้ประชาชนสวมหน้ากากอนามัยในพื้นที่แออัดเนื่องจากเข้าสู่ช่วงฤดูฝน`;
  }

  if (queryLower.includes('ภูเก็ต') || queryLower.includes('อาหาร') || queryLower.includes('ท้องเสีย')) {
    return `📌 **บทวิเคราะห์คลัสเตอร์จังหวัดภูเก็ต:**
พื้นที่ **ภูเก็ต** มีคลัสเตอร์หลักเกี่ยวข้องกับ **Food Poisoning (อาหารเป็นพิษ)** และ **Diarrhea (ท้องร่วง)** ซึ่งกระจายตัวค่อนข้างสูงในกลุ่มผู้ป่วยที่เข้ารับการรักษากับแพทย์แผนกทั่วไปและฉุกเฉิน 

**ข้อแนะนำสำหรับพื้นที่ภูเก็ต:**
1. ลงพื้นที่ตรวจสอบสุขอนามัยของร้านอาหารในแหล่งท่องเที่ยวหลัก
2. เผยแพร่ความรู้เรื่อง "กินร้อน ช้อนกลาง ล้างมือ" ทั้งภาษาไทยและภาษาอังกฤษให้กับนักท่องเที่ยวและผู้ประกอบการ
3. เตรียมสำรองเกลือแร่ (ORS) และยาฆ่าเชื้อเบื้องต้นในสถานพยาบาลพิกัดท่องเที่ยว`;
  }

  if (queryLower.includes('กรุงเทพ') || queryLower.includes('ไข้เลือดออก') || queryLower.includes('dengue')) {
    return `📌 **บทวิเคราะห์คลัสเตอร์กรุงเทพมหานคร:**
ในเขตกรุงเทพฯ พบแนวโน้มของโรค **Dengue Fever (ไข้เลือดออก)** และ **Covid-19** ปรากฏขึ้นอย่างต่อเนื่อง แม้จะกระจายตัวในหลายโรงพยาบาล (เช่น Siriraj, Thonburi Hospital, Bangkok General) แต่ความหนาแน่นยังอยู่ในระดับเฝ้าระวังปกติ

**ข้อแนะนำสำหรับพื้นที่กรุงเทพฯ:**
1. รณรงค์กำจัดแหล่งน้ำขังที่เป็นแหล่งเพาะพันธุ์ยุงลายเพื่อคุมระดับไข้เลือดออก
2. เฝ้าระวังผู้ป่วยที่มีอาการไข้สูงติดต่อกันเกิน 3 วัน
3. จัดโปรแกรมรณรงค์ฉีดวัคซีน Covid-19 ประจำปี`;
  }

  // Default response matching the statistics summary
  return `สวัสดีครับแพทย์หญิงแนนและเจ้าหน้าที่ผู้เกี่ยวข้อง จากสถิติล่าสุดในระบบ **Health Radar**:

1. 📈 **เชียงใหม่:** กำลังประสบปัญหากับคลัสเตอร์อาการ **Flu symptoms** และ **Sore throat** ที่พุ่งสูงขึ้นอย่างรวดเร็วในช่วงสัปดาห์ที่ผ่านมา มีความเสี่ยงระดับเตือนภัยสีเหลืองเข้ม
2. 🏖️ **ภูเก็ต:** มีรายงานเคสกลุ่มอาการอาหารเป็นพิษ (**Food Poisoning**) ปะปนมากับเคสท้องร่วงอย่างสม่ำเสมอ คาดว่าเป็นผลจากการบริโภคอาหารนอกสถานที่ในเขตท่องเที่ยว
3. 🏙️ **กรุงเทพฯ:** พบยอดเคสสะสมสูงสุดแต่มีการกระจายแผนกที่สม่ำเสมอ อาการหลักคือไข้เลือดออก (**Dengue**) และโควิด-19
4. 🏥 **อัตรา No-Show:** ปัจจุบันอยู่ที่ **15%** แนะนำให้ส่งข้อความ SMS ยืนยันการนัดล่วงหน้า 24 ชั่วโมง เพื่อลดอัตราการสูญเสียทรัพยากรบุคคลากรทางการแพทย์

มีข้อมูลหรือจังหวัดไหนที่ต้องการให้เจาะลึกวิเคราะห์เป็นพิเศษไหมครับ?`;
}
