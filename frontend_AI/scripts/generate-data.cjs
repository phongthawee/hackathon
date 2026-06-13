const fs = require('fs');
const path = require('path');

// Resolve directories
const rawDir = path.resolve(__dirname, '../../data');
const destDir = path.resolve(__dirname, '../server/data');

console.log(`Reading raw data from: ${rawDir}`);
console.log(`Writing expanded data to: ${destDir}`);

// Ensure destination directory exists
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Load raw data files
const rawAppointments = JSON.parse(fs.readFileSync(path.join(rawDir, 'appointments.json'), 'utf-8'));
const doctors = JSON.parse(fs.readFileSync(path.join(rawDir, 'doctors.json'), 'utf-8'));
const locations = JSON.parse(fs.readFileSync(path.join(rawDir, 'locations.json'), 'utf-8'));
const users = JSON.parse(fs.readFileSync(path.join(rawDir, 'users.json'), 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(path.join(rawDir, 'reviews.json'), 'utf-8'));

// Copy basic profiles directly
fs.writeFileSync(path.join(destDir, 'doctors.json'), JSON.stringify(doctors, null, 2));
fs.writeFileSync(path.join(destDir, 'locations.json'), JSON.stringify(locations, null, 2));
fs.writeFileSync(path.join(destDir, 'users.json'), JSON.stringify(users, null, 2));
fs.writeFileSync(path.join(destDir, 'reviews.json'), JSON.stringify(reviews, null, 2));

console.log('Successfully copied base entities: doctors, locations, users, and reviews.');

// Define date constraints relative to the current workspace date (2026-06-13)
const CURRENT_DATE = new Date('2026-06-13T10:00:00Z');
const START_DATE = new Date('2026-03-15T00:00:00Z'); // ~90 days back

// Map doctors to cities to guide the outbreak simulation
const hospitalToCity = {
  'Chiang Mai Ram': 'Chiang Mai',
  'Phuket International': 'Phuket',
  'Bangkok General': 'Bangkok',
  'Siriraj': 'Bangkok',
  'Bumrungrad': 'Bangkok',
  'Thonburi Hospital': 'Bangkok',
  'Samitivej': 'Bangkok',
  'Siam Medical': 'Bangkok',
  'Central Health': 'Chon Buri', // Assign default regions for coverage
  'City Hospital': 'Khon Kaen'   // Assign default regions for coverage
};

const docMap = {};
doctors.forEach(doc => {
  docMap[doc.doctor_id] = {
    hospital: doc.hospital,
    city: hospitalToCity[doc.hospital] || 'Bangkok'
  };
});

// Outbreak configuration details
const symptoms = [
  'Flu symptoms', 'Sore throat', 'Diarrhea', 'Food Poisoning', 
  'Dengue Fever', 'Covid-19', 'Allergy', 'Headache', 'Back pain', 
  'Toothache', 'Stomach ache', 'Pregnancy checkup', 'Vaccination', 
  'Annual Checkup', 'Dizziness', 'Skin rash'
];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(start, end) {
  const startMs = start.getTime();
  const endMs = end.getTime();
  const randomMs = startMs + Math.random() * (endMs - startMs);
  return new Date(randomMs);
}

// Create expanded appointments list
const expandedAppointments = [];

// 1. Shift the original 50 appointments to fit our date range
rawAppointments.forEach((apt, index) => {
  const newDate = getRandomDate(START_DATE, CURRENT_DATE);
  expandedAppointments.push({
    apt_id: `apt-${String(index + 1).padStart(3, '0')}`,
    user_id: apt.user_id,
    doctor_id: apt.doctor_id,
    date: newDate.toISOString(),
    symptom: apt.symptom,
    status: apt.status
  });
});

// 2. Generate 270 new records to reach a total of 320 records
const targetTotal = 320;
let currentId = 51;

while (expandedAppointments.length < targetTotal) {
  const user = getRandomItem(users);
  const doc = getRandomItem(doctors);
  const docInfo = docMap[doc.doctor_id];
  const city = docInfo.city;

  // Generate date
  let date = getRandomDate(START_DATE, CURRENT_DATE);

  // Status mapping distribution
  let status = 'COMPLETED';
  const randStatus = Math.random();
  if (randStatus < 0.15) {
    status = 'NO_SHOW';
  } else if (randStatus < 0.23) {
    status = 'CANCELLED';
  } else if (randStatus < 0.27) {
    // Upcoming appointments (after June 13, 2026)
    date = getRandomDate(CURRENT_DATE, new Date('2026-06-30T23:59:59Z'));
    status = Math.random() > 0.5 ? 'CONFIRMED' : 'PENDING';
  } else if (randStatus < 0.33) {
    // PENDING in recent days
    date = getRandomDate(new Date('2026-06-08T00:00:00Z'), CURRENT_DATE);
    status = 'PENDING';
  }

  // Outbreak-specific symptom routing
  let symptom = getRandomItem(symptoms);
  const isOutbreakDate = date.getTime() > new Date('2026-06-01T00:00:00Z').getTime();

  if (city === 'Chiang Mai') {
    if (isOutbreakDate && Math.random() < 0.75) {
      // High outbreak spike of Flu in Chiang Mai in June
      symptom = Math.random() > 0.3 ? 'Flu symptoms' : 'Sore throat';
    } else if (Math.random() < 0.4) {
      symptom = 'Flu symptoms';
    }
  } else if (city === 'Phuket') {
    if (Math.random() < 0.6) {
      // Continuous food poisoning and diarrhea in tourist region Phuket
      symptom = Math.random() > 0.4 ? 'Food Poisoning' : 'Diarrhea';
    }
  } else if (city === 'Bangkok') {
    if (Math.random() < 0.35) {
      symptom = Math.random() > 0.5 ? 'Dengue Fever' : 'Covid-19';
    }
  }

  expandedAppointments.push({
    apt_id: `apt-${String(currentId).padStart(3, '0')}`,
    user_id: user.user_id,
    doctor_id: doc.doctor_id,
    date: date.toISOString(),
    symptom: symptom,
    status: status
  });

  currentId++;
}

// Sort appointments by date descending (newest first)
expandedAppointments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

// Save to destination
fs.writeFileSync(
  path.join(destDir, 'appointments.json'),
  JSON.stringify(expandedAppointments, null, 2)
);

console.log(`Successfully generated ${expandedAppointments.length} expanded appointments at ${path.join(destDir, 'appointments.json')}`);
