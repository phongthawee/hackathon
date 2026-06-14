import { defineEventHandler } from 'h3';
import { serverSupabaseClient } from '#supabase/server';

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

interface AppointmentRaw {
  apt_id: string;
  user_id: string;
  doctor_id: string;
  date: string;
  symptom: string;
  status: string;
}

interface Doctor {
  doctor_id: string;
  name: string;
  department: string;
  hospital: string;
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

function detectCityFromAddress(address: string) {
  const source = (address || '').toLowerCase();
  if (source.includes('chiang mai')) return 'Chiang Mai';
  if (source.includes('phuket')) return 'Phuket';
  if (source.includes('khon kaen')) return 'Khon Kaen';
  if (source.includes('chon buri')) return 'Chon Buri';
  if (source.includes('bangkok')) return 'Bangkok';
  return 'Bangkok';
}

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event);

  try {
    const { data: appointmentsRaw, error: appointmentsError } = await supabase
      .from('appointments')
      .select('apt_id,user_id,doctor_id,date,symptom,status');

    if (appointmentsError) {
      throw appointmentsError;
    }

    const doctorIds = [...new Set(((appointmentsRaw || []) as AppointmentRaw[]).map(a => a.doctor_id).filter(Boolean))] as string[];
    let doctors: Doctor[] = [];
    if (doctorIds.length > 0) {
      const { data, error } = await supabase
        .from('doctors')
        .select('doctor_id,name,department,hospital')
        .in('doctor_id', doctorIds);
      if (error) {
        throw error;
      }
      doctors = (data || []) as Doctor[];
    }

    const { data: locationsRaw, error: locationsError } = await supabase
      .from('locations')
      .select('location_id,name,type,address,coordinates')
      .eq('type', 'HOSPITAL');

    if (locationsError) {
      throw locationsError;
    }

    const locations = (locationsRaw || []) as LocationRecord[];
    const locationsByNormalizedName = new Map<string, LocationRecord>();
    locations.forEach(loc => {
      locationsByNormalizedName.set(normalizeName(loc.name), loc);
    });

    const docMap = new Map<string, Doctor>();
    doctors.forEach(doc => docMap.set(doc.doctor_id, doc));

    const appointments = (appointmentsRaw || []) as AppointmentRaw[];
    const totalCases = appointments.length;

    // 1. Calculate No-Show rate
    const noShowCases = appointments.filter(a => a.status === 'NO_SHOW').length;
    const noShowRate = totalCases > 0 ? (noShowCases / totalCases) * 100 : 0;

    // 2. Map symptoms & departments
    const symptomCounts: Record<string, number> = {};
    const departmentCounts: Record<string, number> = {};
    const hotspotData = new Map<string, {
      locationId: string;
      city: string;
      locationName: string;
      lat: number;
      lng: number;
      total: number;
      active: number;
      symptoms: Record<string, number>;
    }>();

    // Start from DB hospital locations so every hospital is visible on the map.
    locations.forEach((loc) => {
      if (!loc.coordinates?.lat || !loc.coordinates?.lng) {
        return;
      }

      const city = detectCityFromAddress(loc.address);
      const key = loc.location_id;

      hotspotData.set(key, {
        locationId: loc.location_id,
        city,
        locationName: loc.name,
        lat: Number(loc.coordinates.lat),
        lng: Number(loc.coordinates.lng),
        total: 0,
        active: 0,
        symptoms: {}
      });
    });

    appointments.forEach(apt => {
      // General symptoms count
      symptomCounts[apt.symptom] = (symptomCounts[apt.symptom] || 0) + 1;

      // Doctor lookup
      const doc = docMap.get(apt.doctor_id);
      if (doc) {
        // Department counts
        departmentCounts[doc.department] = (departmentCounts[doc.department] || 0) + 1;
        
        // City mapping
        const city = hospitalToCity[doc.hospital] || 'Bangkok';

        const normalizedDoctorHospital = normalizeName(doc.hospital);
        const location = locationsByNormalizedName.get(normalizedDoctorHospital);
        if (!location) {
          return;
        }

        const key = location.location_id;

        const aggregate = hotspotData.get(key);
        if (aggregate) {
          aggregate.city = city;
          aggregate.total += 1;
          aggregate.symptoms[apt.symptom] = (aggregate.symptoms[apt.symptom] || 0) + 1;
          if (apt.status === 'CONFIRMED' || apt.status === 'PENDING') {
            aggregate.active += 1;
          }
        }
      }
    });

    // 3. Find top symptom
    let topSymptom = 'None';
    let maxSymptomCount = 0;
    Object.entries(symptomCounts).forEach(([symptom, count]) => {
      if (count > maxSymptomCount) {
        maxSymptomCount = count;
        topSymptom = symptom;
      }
    });

    // 4. Format Top 5 Symptoms for Donut Chart
    const topSymptoms = Object.entries(symptomCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // 5. Format Department workloads for Bar Chart
    const departmentLoads = Object.entries(departmentCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // 6. Format Province Map Pin Hotspots
    const hotspots = Array.from(hotspotData.values()).map((data) => {
      const sortedSymptoms = Object.entries(data.symptoms)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => `${name} (${count})`);
      
      // Dynamic severity status logic
      let severity: 'high' | 'medium' | 'low' = 'low';
      if (data.total > 100 || data.active > 30) {
        severity = 'high';
      } else if (data.total > 40) {
        severity = 'medium';
      }

      return {
        locationId: data.locationId,
        city: data.city,
        hospitalName: data.locationName,
        lat: data.lat,
        lng: data.lng,
        totalCases: data.total,
        activeCases: data.active,
        severity,
        topSymptoms: sortedSymptoms
      };
    });

    // 7. Calculate Time-Series Yearly Trend (12 Months)
    // Group data by Month, but to avoid visual clutter (spaghetti graph),
    // we only track the Top 4 symptoms + 'อื่นๆ' (Others).
    
    // We already have `topSymptoms` calculated above (Top 5). 
    // Let's use the top 4 from it.
    const top4SymptomNames = topSymptoms.slice(0, 4).map(s => s.name);
    
    const yearlyTrendMap: Record<string, Record<string, number>> = {};

    const endDate = appointments.length
      ? new Date(Math.max(...appointments.map(a => new Date(a.date).getTime())))
      : new Date();
    
    // Generate 12 monthly bins ending at the month of endDate
    const months: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push(monthStr);
      
      const currentMonthRecord: Record<string, number> = {};
      
      // Initialize Top 4 + อื่นๆ with 0
      top4SymptomNames.forEach(sym => {
        if (sym) currentMonthRecord[sym] = 0;
      });
      currentMonthRecord['อื่นๆ'] = 0;
      
      yearlyTrendMap[monthStr] = currentMonthRecord;
    }

    // Populate data
    appointments.forEach(apt => {
      const d = new Date(apt.date);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const record = yearlyTrendMap[monthStr];
      if (record) {
        const sym = apt.symptom || 'ไม่ระบุอาการ';
        if (top4SymptomNames.includes(sym)) {
          record[sym] = (record[sym] || 0) + 1;
        } else {
          record['อื่นๆ'] = (record['อื่นๆ'] || 0) + 1;
        }
      }
    });

    const trend = months.map(month => {
      // Short month label (e.g., 'Jan', 'Feb' + Year)
      const [year, m] = month.split('-');
      const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      const label = `${monthNames[parseInt(m!, 10) - 1]} ${year!.slice(2)}`;
      return {
        label,
        ...yearlyTrendMap[month]
      };
    });

    // Alert logic based on active case speed in the last week
    const lastWeekLimit = endDate.getTime() - (7 * 24 * 60 * 60 * 1000);
    const recentCases = appointments.filter(
      a => new Date(a.date).getTime() >= lastWeekLimit && ((a.symptom || '') === 'ไข้หวัดใหญ่' || (a.symptom || '') === 'ไข้เลือดออก' || (a.symptom || '').includes('Flu') || (a.symptom || '').includes('Dengue'))
    ).length;

    let alertLevel = 'GREEN';
    if (recentCases > 20) {
      alertLevel = 'RED';
    } else if (recentCases > 8) {
      alertLevel = 'YELLOW';
    }

    return {
      success: true,
      kpis: {
        totalCases,
        alertLevel,
        topSymptom,
        noShowRate: parseFloat(noShowRate.toFixed(1)),
        activeCitiesCount: new Set(hotspots.map(h => h.city)).size
      },
      hotspots,
      trend,
      topSymptoms,
      departmentLoads
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
});
