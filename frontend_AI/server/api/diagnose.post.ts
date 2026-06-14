import { defineEventHandler, readBody } from 'h3';
import fs from 'fs';
import path from 'path';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const symptom = body?.symptom || '';

  if (!symptom.trim()) {
    return {
      success: false,
      error: 'กรุณาระบุอาการของผู้ป่วย'
    };
  }

  // 1. Construct the prompt for Gemini
  const prompt = `คุณคือ "ระบบ AI คัดกรองและประเมินโรคระบาดของโรงพยาบาล" มีหน้าที่ประเมินอาการที่ได้รับและระบุชื่อโรคที่มีความเป็นไปได้มากที่สุดเพียงโรคเดียวเท่านั้น 

### กฎการวิเคราะห์และการตอบกลับอย่างเคร่งครัด:
1. วิเคราะห์ว่าอาการดังกล่าวตรงกับโรคใด
2. ประเมินว่าโรคนั้น **สามารถแพร่ระบาดหรือติดต่อสู่ผู้อื่นได้หรือไม่ (Communicable/Outbreak-prone disease)** เช่น:
   - โรคที่แพร่ระบาดได้ (Epidemic/Outbreak-prone): ไข้เลือดออก (Dengue Fever), ไข้หวัดใหญ่ (Influenza), โควิด-19 (COVID-19), โรคฉี่หนู (Leptospirosis), อาหารเป็นพิษ/ท้องร่วง (Food Poisoning/Diarrhea), ไข้ปวดข้อยุงลาย (Chikungunya), โรคมือเท้าปาก (Hand Foot Mouth Disease), ไข้มาลาเรีย (Malaria) เป็นต้น
   - โรคที่ไม่แพร่ระบาด (Non-communicable/Non-epidemic): สิวอักเสบ (Acne Vulgaris), โรกภูมิแพ้ (Allergy), ปวดฟัน (Toothache), ปวดหลัง (Back Pain), ไข้หวัดทั่วไป (Common Cold), ออฟฟิศซินโดรม เป็นต้น
3. การแสดงผลลัพธ์:
   - หากเป็น **โรคที่สามารถแพร่ระบาดได้** ให้ตอบเฉพาะ: "ชื่อโรคภาษาไทย (ชื่อโรคภาษาอังกฤษ)" เช่น "ไข้เลือดออก (Dengue Fever)" หรือ "โรคฉี่หนู (Leptospirosis)"
   - หากเป็น **โรคที่ไม่แพร่ระบาด** ให้ตอบในรูปแบบ: "ไม่ใช่โรคที่แพร่ระบาด (ชื่อโรคภาษาไทย (ชื่อโรคภาษาอังกฤษ))" เช่น "ไม่ใช่โรคที่แพร่ระบาด (สิวอักเสบ (Acne Vulgaris))" หรือ "ไม่ใช่โรคที่แพร่ระบาด (โรคภูมิแพ้ (Allergy))" หรือ "ไม่ใช่โรคที่แพร่ระบาด (ไข้หวัดทั่วไป (Common Cold))"
4. ข้อกำหนดเสริม:
   - ห้ามมีคำอธิบายอื่น ๆ นอกเหนือจากรูปแบบที่กำหนดไว้ด้านบน
   - ห้ามมีคำเกริ่นนำ คำทักทาย หรือเครื่องหมายคำพูดครอบคลุมภายนอกสุด

อาการของผู้ป่วย: "${symptom}"
คำสั่ง: กรุณาระบุชื่อโรคและระบุสถานะการระบาดตามกฎเกณฑ์ข้างต้นทันที`;

  // 2. Load Gemini API Key (Read from .env file first to get the most updated key)
  let apiKey = '';
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
    console.error('Error reading .env files in diagnose API:', err);
  }

  if (!apiKey) {
    apiKey = process.env.GEMINI_API_KEY || process.env.NUXT_GEMINI_API_KEY || '';
  }

  // 3. Handle missing API key
  if (!apiKey) {
    return {
      success: false,
      error: 'ไม่พบ GEMINI_API_KEY ในการตั้งค่าระบบ กรุณาตรวจสอบไฟล์ .env'
    };
  }

  // 4. Invoke Gemini API
  const modelsToTry = ['gemini-3.5-flash', 'gemma-4-31b-it', 'gemini-2.0-flash'];
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
                parts: [{ text: prompt }]
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
        console.warn(`Failed to call Gemini model ${model} in diagnose API:`, errText);
        lastError = new Error(`Gemini API HTTP Error ${res.status}: ${errText}`);
      }
    } catch (err: any) {
      console.warn(`Error calling model ${model} in diagnose API:`, err);
      lastError = err;
    }
  }

  if (!response) {
    return {
      success: false,
      error: `ไม่สามารถเรียกใช้งาน Gemini API ได้: ${lastError?.message || 'โมเดลทั้งหมดล้มเหลวในการตอบสนอง'}`
    };
  }

  try {
    const resData = await response.json();
    const parts = resData.candidates?.[0]?.content?.parts || [];
    const textPart = parts.find((p: any) => !p.thought);
    const generatedText = textPart?.text || '';

    // Clean text: strip any quotes or surrounding whitespace/newlines
    const cleanDisease = generatedText.trim().replace(/^["']|["']$/g, '');

    return {
      success: true,
      disease: cleanDisease || 'ไม่สามารถระบุได้ (Undetermined)',
      isMock: false
    };
  } catch (err: any) {
    console.error('Failed to parse Gemini response:', err);
    return {
      success: false,
      error: `เกิดข้อผิดพลาดในการประมวลผลผลลัพธ์ของ AI: ${err.message}`
    };
  }
});

// A helper to generate realistic mockup diagnosis based on keywords
function getMockDiagnosis(symptom: string): string {
  const s = symptom.toLowerCase();

  if (s.includes('ไข้ปวดข้อ') || s.includes('ปวดกระดูก') || s.includes('chikungunya') || s.includes('ชิคุนกุนยา')) {
    return 'ไข้ปวดข้อยุงลาย (Chikungunya)';
  }
  if (s.includes('ไข้เลือดออก') || s.includes('dengue') || s.includes('ยุงกัด') || (s.includes('ไข้สูง') && s.includes('ผื่นแดง'))) {
    return 'ไข้เลือดออก (Dengue Fever)';
  }
  if (s.includes('โควิด') || s.includes('covid') || s.includes('ลิ้นไม่รับรส') || s.includes('จมูกไม่ได้กลิ่น')) {
    return 'โควิด-19 (COVID-19)';
  }
  if (s.includes('หวัด') || s.includes('ไอ') || s.includes('เจ็บคอ') || s.includes('flu') || s.includes('cough') || s.includes('sore throat')) {
    return 'ไข้หวัดใหญ่ (Influenza)';
  }
  if (s.includes('อาหารเป็นพิษ') || s.includes('ท้องเสีย') || s.includes('ท้องร่วง') || s.includes('อาเจียน') || s.includes('diarrhea') || s.includes('food poisoning')) {
    return 'อาหารเป็นพิษ (Food Poisoning)';
  }
  if (s.includes('ผื่น') || s.includes('คัน') || s.includes('ลมพิษ') || s.includes('rash') || s.includes('itch')) {
    return 'ลมพิษ (Urticaria)';
  }
  if (s.includes('หืด') || s.includes('หอบ') || s.includes('หายใจลำบาก') || s.includes('asthma')) {
    return 'โรคหืดหอบ (Asthma)';
  }

  return 'ไข้หวัดทั่วไป (Common Cold)';
}
