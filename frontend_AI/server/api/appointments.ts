import { defineEventHandler, getQuery } from 'h3';
import fs from 'fs';
import path from 'path';

// Define data mappings for geographical routing
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

interface User {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  loyalty_points: number;
  role: string;
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  
  // Extract query parameters
  const page = parseInt(query.page as string || '1', 10);
  const limit = parseInt(query.limit as string || '10', 10);
  const search = (query.search as string || '').toLowerCase();
  const symptom = (query.symptom as string || '');
  const status = (query.status as string || '');
  const city = (query.city as string || '');
  const department = (query.department as string || '');
  const startDateStr = query.startDate as string || '';
  const endDateStr = query.endDate as string || '';

  const dataDir = path.resolve(process.cwd(), 'server/data');

  try {
    // Read JSON files
    const appointmentsRaw: AppointmentRaw[] = JSON.parse(
      fs.readFileSync(path.join(dataDir, 'appointments.json'), 'utf-8')
    );
    const doctors: Doctor[] = JSON.parse(
      fs.readFileSync(path.join(dataDir, 'doctors.json'), 'utf-8')
    );
    const users: User[] = JSON.parse(
      fs.readFileSync(path.join(dataDir, 'users.json'), 'utf-8')
    );

    // Create lookup maps
    const docMap = new Map<string, Doctor>();
    doctors.forEach(doc => docMap.set(doc.doctor_id, doc));

    const userMap = new Map<string, User>();
    users.forEach(user => userMap.set(user.user_id, user));

    // Join entities
    let joined = appointmentsRaw.map(apt => {
      const doc = docMap.get(apt.doctor_id);
      const user = userMap.get(apt.user_id);
      const docCity = doc ? (hospitalToCity[doc.hospital] || 'Bangkok') : 'Bangkok';

      return {
        ...apt,
        patient_name: user ? user.name : 'Unknown Patient',
        patient_email: user ? user.email : '',
        patient_phone: user ? user.phone : '',
        doctor_name: doc ? doc.name : 'Unknown Doctor',
        department: doc ? doc.department : 'General Medicine',
        hospital: doc ? doc.hospital : 'Central Health',
        city: docCity
      };
    });

    // Apply filters
    if (search) {
      joined = joined.filter(item => 
        item.apt_id.toLowerCase().includes(search) ||
        item.patient_name.toLowerCase().includes(search) ||
        item.doctor_name.toLowerCase().includes(search) ||
        item.symptom.toLowerCase().includes(search)
      );
    }

    if (symptom) {
      joined = joined.filter(item => item.symptom === symptom);
    }

    if (status) {
      joined = joined.filter(item => item.status === status);
    }

    if (city) {
      joined = joined.filter(item => item.city === city);
    }

    if (department) {
      joined = joined.filter(item => item.department === department);
    }

    if (startDateStr) {
      const start = new Date(startDateStr).getTime();
      joined = joined.filter(item => new Date(item.date).getTime() >= start);
    }

    if (endDateStr) {
      const end = new Date(endDateStr).getTime();
      joined = joined.filter(item => new Date(item.date).getTime() <= end);
    }

    // Paginate results
    const total = joined.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedItems = joined.slice(offset, offset + limit);

    return {
      success: true,
      total,
      page,
      limit,
      totalPages,
      items: paginatedItems
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
});
