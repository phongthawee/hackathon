import { defineEventHandler } from 'h3';
import { serverSupabaseClient } from '#supabase/server';

interface ConfirmedCase {
  apt_id: string;
  patient_name: string;
  doctor_name: string;
  hospital_name: string;
  hospital_address: string;
  symptom: string;
  gemini_analysis: string | null;
  status: string;
  appointment_date: string;
}

interface LocationRecord {
  location_id: string;
  name: string;
  type: string;
  address: string;
  coordinates: { lat?: number; lng?: number } | null;
}

function normalizeName(value: string) {
  return (value || '')
    .toLowerCase()
    .replace(/hospital|medical|center|international|memorial|general|city|clinic/gi, '')
    .replace(/[^a-z0-9]/g, '');
}

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event);

  try {
    // 1. ดึงข้อมูลจาก View vw_confirmed_analysis
    const { data: rawCases, error: casesError } = await (supabase as any)
      .from('vw_confirmed_analysis')
      .select('*');

    if (casesError) {
      console.error('Error fetching vw_confirmed_analysis:', casesError);
      throw casesError;
    }

    const allCases = (rawCases || []) as ConfirmedCase[];

    // กรองเอาเฉพาะโรคระบาด/โรคที่แพร่ติดต่อได้ โดยไม่แสดงโรคไข้หวัดทั่วไป หรือโรคที่ไม่แพร่ระบาด หรือข้อมูลที่ยังไม่ได้วิเคราะห์/วิเคราะห์ไม่ได้
    const cases = allCases.filter(c => {
      const disease = c.gemini_analysis || '';
      if (!disease.trim() || disease.includes('Pending') || disease.includes('รอดำเนินการ')) {
        return false;
      }
      const isCommonCold = disease.includes('ไข้หวัดทั่วไป') || disease.toLowerCase().includes('common cold');
      const isNonCommunicable = disease.includes('ไม่ใช่โรคที่แพร่ระบาด');
      const isUndetermined = disease.includes('ไม่สามารถระบุได้') || disease.toLowerCase().includes('undetermined');
      
      return !isCommonCold && !isNonCommunicable && !isUndetermined;
    });

    // 2. ดึงข้อมูลสถานที่โรงพยาบาลจาก locations
    const { data: rawLocations, error: locationsError } = await supabase
      .from('locations')
      .select('location_id,name,type,address,coordinates')
      .eq('type', 'HOSPITAL');

    if (locationsError) {
      console.error('Error fetching locations:', locationsError);
      throw locationsError;
    }

    const locations = (rawLocations || []) as LocationRecord[];

    // 3. สร้าง Map สำหรับแปลงและจับคู่ชื่อโรงพยาบาล
    const locationMap = new Map<string, LocationRecord>();
    locations.forEach(loc => {
      locationMap.set(normalizeName(loc.name), loc);
    });

    // 4. ทำการจัดกลุ่มคนไข้ตามสถานพยาบาล
    const hospitalAggregations = new Map<string, {
      hospitalName: string;
      address: string;
      lat: number;
      lng: number;
      totalCases: number;
      symptoms: Record<string, number>;
      geminiAnalyses: Record<string, number>;
      patients: {
        patientName: string;
        symptom: string;
        disease: string;
        date: string;
      }[];
    }>();

    // ดึงพิกัดตั้งต้นของโรงพยาบาลทั้งหมดขึ้นมาก่อน เพื่อให้แสดงบนแผนที่แม้จะไม่มีผู้ป่วย
    locations.forEach(loc => {
      if (loc.coordinates?.lat && loc.coordinates?.lng) {
        hospitalAggregations.set(normalizeName(loc.name), {
          hospitalName: loc.name,
          address: loc.address,
          lat: Number(loc.coordinates.lat),
          lng: Number(loc.coordinates.lng),
          totalCases: 0,
          symptoms: {},
          geminiAnalyses: {},
          patients: []
        });
      }
    });

    // รวบรวมข้อมูลผู้ป่วยที่ถูกคอนเฟิร์มแล้วมานับยอดและวิเคราะห์โรค
    cases.forEach(c => {
      const normalizedHospitalName = normalizeName(c.hospital_name);
      
      // ค้นหาตำแหน่งหากไม่มีการปักพิกัดไว้ก่อนหน้า
      let agg = hospitalAggregations.get(normalizedHospitalName);
      
      if (!agg) {
        // ลองจับคู่จาก locations
        const matchLoc = locationMap.get(normalizedHospitalName);
        const lat = matchLoc?.coordinates?.lat ? Number(matchLoc.coordinates.lat) : 13.7563; // Default BKK
        const lng = matchLoc?.coordinates?.lng ? Number(matchLoc.coordinates.lng) : 100.5018;
        
        agg = {
          hospitalName: c.hospital_name,
          address: c.hospital_address || matchLoc?.address || 'Unknown Address',
          lat,
          lng,
          totalCases: 0,
          symptoms: {},
          geminiAnalyses: {},
          patients: []
        };
        hospitalAggregations.set(normalizedHospitalName, agg);
      }

      // อัปเดตยอดสะสม
      agg.totalCases += 1;

      // จัดกลุ่มอาการแรกเริ่ม
      if (c.symptom) {
        agg.symptoms[c.symptom] = (agg.symptoms[c.symptom] || 0) + 1;
      }

      // จัดกลุ่มผลลัพธ์การวินิจฉัยจาก AI (Gemini)
      const disease = c.gemini_analysis || 'รอดำเนินการวิเคราะห์ (Pending)';
      agg.geminiAnalyses[disease] = (agg.geminiAnalyses[disease] || 0) + 1;

      // บันทึกข้อมูลคนไข้รายย่อย
      agg.patients.push({
        patientName: c.patient_name || 'ไม่ระบุชื่อ',
        symptom: c.symptom || 'ไม่ระบุอาการ',
        disease: disease,
        date: c.appointment_date || 'ไม่ระบุวันนัด'
      });
    });

    // แปลง Map เป็น Array
    const hotspots = Array.from(hospitalAggregations.values());

    // 5. ค้นหาพื้นที่ความเสี่ยงสูงสุด (Top Risk Area) ที่มีจำนวนผู้ป่วยเยอะที่สุด
    let topRiskLocation = null;
    let maxCases = -1;

    hotspots.forEach(spot => {
      if (spot.totalCases > maxCases) {
        maxCases = spot.totalCases;
        topRiskLocation = spot;
      }
    });

    return {
      success: true,
      hotspots: hotspots.sort((a, b) => b.totalCases - a.totalCases), // เรียงลำดับจากเคสมากไปน้อย
      topRiskLocation,
      totalConfirmedCases: cases.length
    };

  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'เกิดข้อผิดพลาดในการประมวลผลพื้นที่เสี่ยงโรค'
    };
  }
});
