import { defineEventHandler } from 'h3';
import fs from 'fs';
import path from 'path';

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

const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  'Bangkok': { lat: 13.7563, lng: 100.5018 },
  'Chiang Mai': { lat: 18.7883, lng: 98.9853 },
  'Phuket': { lat: 7.8804, lng: 98.3923 },
  'Khon Kaen': { lat: 16.4322, lng: 102.8236 },
  'Chon Buri': { lat: 13.3611, lng: 100.9847 }
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

export default defineEventHandler(async () => {
  const dataDir = path.resolve(process.cwd(), 'server/data');

  try {
    const appointmentsRaw: AppointmentRaw[] = JSON.parse(
      fs.readFileSync(path.join(dataDir, 'appointments.json'), 'utf-8')
    );
    const doctors: Doctor[] = JSON.parse(
      fs.readFileSync(path.join(dataDir, 'doctors.json'), 'utf-8')
    );

    const docMap = new Map<string, Doctor>();
    doctors.forEach(doc => docMap.set(doc.doctor_id, doc));

    const totalCases = appointmentsRaw.length;

    // 1. Calculate No-Show rate
    const noShowCases = appointmentsRaw.filter(a => a.status === 'NO_SHOW').length;
    const noShowRate = totalCases > 0 ? (noShowCases / totalCases) * 100 : 0;

    // 2. Map symptoms & departments
    const symptomCounts: Record<string, number> = {};
    const departmentCounts: Record<string, number> = {};
    const cityData: Record<string, { total: number; symptoms: Record<string, number>; active: number }> = {
      'Bangkok': { total: 0, symptoms: {}, active: 0 },
      'Chiang Mai': { total: 0, symptoms: {}, active: 0 },
      'Phuket': { total: 0, symptoms: {}, active: 0 },
      'Khon Kaen': { total: 0, symptoms: {}, active: 0 },
      'Chon Buri': { total: 0, symptoms: {}, active: 0 }
    };

    appointmentsRaw.forEach(apt => {
      // General symptoms count
      symptomCounts[apt.symptom] = (symptomCounts[apt.symptom] || 0) + 1;

      // Doctor lookup
      const doc = docMap.get(apt.doctor_id);
      if (doc) {
        // Department counts
        departmentCounts[doc.department] = (departmentCounts[doc.department] || 0) + 1;
        
        // City mapping
        const city = hospitalToCity[doc.hospital] || 'Bangkok';
        if (cityData[city]) {
          cityData[city].total += 1;
          cityData[city].symptoms[apt.symptom] = (cityData[city].symptoms[apt.symptom] || 0) + 1;
          if (apt.status === 'CONFIRMED' || apt.status === 'PENDING') {
            cityData[city].active += 1;
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
    const hotspots = Object.entries(cityData).map(([city, data]) => {
      const sortedSymptoms = Object.entries(data.symptoms)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => `${name} (${count})`);

      const coords = cityCoordinates[city] || { lat: 13.7563, lng: 100.5018 };
      
      // Dynamic severity status logic
      let severity: 'high' | 'medium' | 'low' = 'low';
      if (data.total > 100 || data.active > 30) {
        severity = 'high';
      } else if (data.total > 40) {
        severity = 'medium';
      }

      return {
        city,
        lat: coords.lat,
        lng: coords.lng,
        totalCases: data.total,
        activeCases: data.active,
        severity,
        topSymptoms: sortedSymptoms
      };
    });

    // 7. Calculate Time-Series Weekly Trend (90 days)
    // We will group data by week (e.g. from March 15 to June 13, approx 13 weeks)
    // Focus on 5 key infectious symptoms
    const targetSymptoms = ['Flu symptoms', 'Food Poisoning', 'Dengue Fever', 'Covid-19', 'Diarrhea'];
    const weeklyTrendMap: Record<string, Record<string, number>> = {};

    // Generate weekly bins
    const weeks: string[] = [];
    const tempDate = new Date('2026-03-15T00:00:00Z');
    const endDate = new Date('2026-06-25T00:00:00Z');

    while (tempDate.getTime() <= endDate.getTime()) {
      const dateStr = tempDate.toISOString().split('T')[0];
      weeks.push(dateStr);
      weeklyTrendMap[dateStr] = {
        'Flu symptoms': 0,
        'Food Poisoning': 0,
        'Dengue Fever': 0,
        'Covid-19': 0,
        'Diarrhea': 0,
        'Others': 0
      };
      tempDate.setDate(tempDate.getDate() + 7); // Increment by 1 week
    }

    appointmentsRaw.forEach(apt => {
      const aptTime = new Date(apt.date).getTime();
      
      // Find the closest preceding week bin
      let assignedWeek = weeks[0];
      for (let i = 0; i < weeks.length; i++) {
        if (aptTime >= new Date(weeks[i]).getTime()) {
          assignedWeek = weeks[i];
        } else {
          break;
        }
      }

      if (weeklyTrendMap[assignedWeek]) {
        if (targetSymptoms.includes(apt.symptom)) {
          weeklyTrendMap[assignedWeek][apt.symptom] += 1;
        } else {
          weeklyTrendMap[assignedWeek]['Others'] += 1;
        }
      }
    });

    const trend = Object.entries(weeklyTrendMap).map(([week, counts]) => {
      // Simplify date label to 'MM/DD' format
      const [year, month, day] = week.split('-');
      const label = `${month}/${day}`;
      return {
        label,
        ...counts
      };
    });

    // Alert logic based on active case speed in the last week
    const lastWeekLimit = new Date('2026-06-06T00:00:00Z').getTime();
    const recentCases = appointmentsRaw.filter(
      a => new Date(a.date).getTime() >= lastWeekLimit && (a.symptom === 'Flu symptoms' || a.symptom === 'Dengue Fever')
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
        activeCitiesCount: hotspots.filter(h => h.totalCases > 0).length
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
