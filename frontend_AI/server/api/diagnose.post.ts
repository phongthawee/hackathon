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
  const prompt = `คุณคือ "ระบบ AI คัดกรองโรคเบื้องต้น" ของทางโรงพยาบาล มีหน้าที่ประเมินอาการที่ได้รับและระบุชื่อโรคที่มีความเป็นไปได้มากที่สุดเพียงโรคเดียวเท่านั้น 

### กฎการตอบกลับอย่างเคร่งครัด:
- ห้ามมีคำอธิบายอื่น ๆ เพิ่มเติม
- ห้ามมีคำเกริ่นนำ คำทักทาย หรือการอ้างอิงใด ๆ
- ห้ามตอบเป็นประโยคยาว
- ให้ตอบกลับมาเป็นเฉพาะ "ชื่อโรคภาษาไทย (ชื่อภาษาอังกฤษ)" เท่านั้น เช่น "ไข้หวัดใหญ่ (Influenza)", "ไข้เลือดออก (Dengue Fever)", "อาหารเป็นพิษ (Food Poisoning)", หรือ "โควิด-19 (COVID-19)" เป็นต้น

อาการของผู้ป่วย: "${symptom}"
คำสั่ง: กรุณาระบุชื่อโรคที่มีสิทธิ์เป็นมากที่สุดเพียงโรคเดียวทันทีตามข้อกำหนดข้างต้น`;

  // 2. Load Gemini API Key
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
      console.error('Error reading fallback .env files in diagnose API:', err);
    }
  }

  // 3. Handle offline / missing key mock mode
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is missing. Utilizing mock diagnosis generator.');
    return {
      success: true,
      disease: getMockDiagnosis(symptom),
      isMock: true
    };
  }

  // 4. Invoke Gemini API
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
    console.error('All Gemini models failed to respond. Falling back to mock diagnosis.');
    return {
      success: true,
      disease: getMockDiagnosis(symptom),
      isMock: true,
      error: lastError?.message || 'All models failed'
    };
  }

  try {
    const resData = await response.json();
    const generatedText = resData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean text: strip any quotes or surrounding whitespace/newlines
    const cleanDisease = generatedText.trim().replace(/^["']|["']$/g, '');

    return {
      success: true,
      disease: cleanDisease || 'ไม่สามารถระบุได้ (Undetermined)',
      isMock: false
    };
  } catch (err: any) {
    console.error('Failed to parse Gemini response, falling back to mock:', err);
    return {
      success: true,
      disease: getMockDiagnosis(symptom),
      isMock: true,
      error: err.message
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
