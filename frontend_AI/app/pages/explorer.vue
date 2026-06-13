<template>
  <div class="flex flex-col gap-lg">
    <!-- Header Row -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-md mb-xs">
      <div>
        <h2 class="font-headline-md text-headline-md text-primary mb-xs">รายการเคสระบาดวิทยา</h2>
        <p class="font-body-md text-body-md text-on-surface-variant">
          แสดงรายการเคสที่กำลังเฝ้าระวัง <span class="font-bold text-on-surface">{{ totalCases }}</span> รายการในภูมิภาคของคุณ
        </p>
      </div>
      <div class="flex items-center gap-md">
        <!-- Export to CSV button (F3 Extra) -->
        <button @click="exportToCSV" class="flex items-center gap-sm px-md py-sm bg-surface-container-lowest border border-surface-variant rounded-lg text-on-surface font-label-caps text-label-caps hover:bg-surface-container-low transition-colors shadow-sm text-xs font-bold">
          <span class="material-symbols-outlined text-[18px]">download</span>
          ส่งออก CSV
        </button>
      </div>
    </div>

    <!-- Advanced Filter Bento Bar -->
    <div class="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-variant p-md flex flex-wrap items-center gap-md">
      <!-- Text Search -->
      <div class="flex-1 min-w-[200px] relative">
        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
        <input 
          v-model="filters.search" 
          @input="debounceQuery" 
          class="w-full bg-background border border-surface-variant rounded-lg py-sm pl-10 pr-sm font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary transition-all text-xs" 
          placeholder="ค้นหา ID, ชื่อหมอ, อาการ..." 
          type="text"/>
      </div>
      
      <!-- Select filters -->
      <div class="flex items-center gap-sm overflow-x-auto pb-1 md:pb-0">
        <!-- Status -->
        <select v-model="filters.status" @change="applyFilters" class="bg-background border border-surface-variant rounded-lg py-sm px-md font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary cursor-pointer text-xs">
          <option value="">สถานะ: ทั้งหมด</option>
          <option value="CONFIRMED">Confirmed (ยืนยันแล้ว)</option>
          <option value="PENDING">Pending (รอดำเนินการ)</option>
          <option value="COMPLETED">Completed (รักษาเสร็จแล้ว)</option>
          <option value="CANCELLED">Cancelled (ยกเลิก)</option>
          <option value="NO_SHOW">No-Show (เบี้ยวนัด)</option>
        </select>
        
        <!-- Region/Location -->
        <select v-model="filters.city" @change="applyFilters" class="bg-background border border-surface-variant rounded-lg py-sm px-md font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary cursor-pointer text-xs">
          <option value="">สถานที่: ทุกภูมิภาค</option>
          <option value="Bangkok">กรุงเทพฯ</option>
          <option value="Chiang Mai">เชียงใหม่</option>
          <option value="Phuket">ภูเก็ต</option>
          <option value="Khon Kaen">ขอนแก่น</option>
          <option value="Chon Buri">ชลบุรี</option>
        </select>
        
        <!-- Department -->
        <select v-model="filters.department" @change="applyFilters" class="bg-background border border-surface-variant rounded-lg py-sm px-md font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary cursor-pointer text-xs">
          <option value="">แผนกการรักษา: ทั้งหมด</option>
          <option v-for="dept in deptOptions" :key="dept" :value="dept">{{ dept }}</option>
        </select>
        
        <button @click="resetFilters" class="flex items-center gap-xs text-primary font-label-caps text-label-caps px-sm py-sm hover:bg-surface-container rounded-lg transition-colors whitespace-nowrap text-xs font-bold">
          <span class="material-symbols-outlined text-[18px]">tune</span> ล้างตัวกรอง
        </button>
      </div>
    </div>

    <!-- Data Table Container -->
    <div class="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-variant overflow-hidden flex-1 flex flex-col min-h-[460px]">
      <div v-if="loading" class="flex-1 flex flex-col items-center justify-center p-xl">
        <p class="animate-pulse text-sm text-outline">🔄 กำลังเรียกค้นข้อมูลเคสจากฐานข้อมูลประชากร...</p>
      </div>

      <div v-else-if="!cases.length" class="flex-1 flex flex-col items-center justify-center p-xl text-outline text-xs">
        <p class="mb-sm">ไม่พบรายการนัดตรวจตามเงื่อนไขตัวกรองปัจจุบัน</p>
        <button @click="resetFilters" class="bg-primary text-on-primary px-4 py-2 rounded-lg font-bold">ล้างตัวกรองทั้งหมด</button>
      </div>

      <div v-else class="overflow-x-auto flex-1">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-surface-container border-b border-surface-variant">
              <th class="py-sm px-md font-label-caps text-label-caps text-on-surface-variant whitespace-nowrap">รหัสเคส</th>
              <th class="py-sm px-md font-label-caps text-label-caps text-on-surface-variant whitespace-nowrap">คนไข้</th>
              <th class="py-sm px-md font-label-caps text-label-caps text-on-surface-variant whitespace-nowrap">อาการหลัก</th>
              <th class="py-sm px-md font-label-caps text-label-caps text-on-surface-variant whitespace-nowrap">แพทย์</th>
              <th class="py-sm px-md font-label-caps text-label-caps text-on-surface-variant whitespace-nowrap">สถานที่ (จังหวัด)</th>
              <th class="py-sm px-md font-label-caps text-label-caps text-on-surface-variant whitespace-nowrap">สถานะ</th>
              <th class="py-sm px-md font-label-caps text-label-caps text-on-surface-variant whitespace-nowrap">วันที่ / เวลา</th>
              <th class="py-sm px-md font-label-caps text-label-caps text-on-surface-variant whitespace-nowrap text-right">ดำเนินการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-variant">
            <tr 
              v-for="item in cases" 
              :key="item.apt_id" 
              class="hover:bg-surface transition-colors group cursor-pointer"
              @click="openCaseDetail(item)">
              <td class="py-md px-md font-data-mono text-data-mono text-primary font-medium">#{{ item.apt_id }}</td>
              <td class="py-md px-md font-body-md text-body-md text-on-surface font-medium flex items-center gap-sm">
                <div class="w-6 h-6 rounded-full bg-surface-variant flex items-center justify-center text-[10px] font-bold text-on-surface-variant">
                  {{ getInitials(item.patient_name) }}
                </div>
                {{ item.patient_name }}
              </td>
              <td class="py-md px-md font-body-md text-body-md text-on-surface-variant">{{ item.symptom }}</td>
              <td class="py-md px-md font-body-md text-body-md text-on-surface">{{ item.doctor_name }}</td>
              <td class="py-md px-md font-body-md text-body-md text-on-surface-variant">
                {{ item.hospital }} <span class="text-outline">({{ getThaiCityName(item.city) }})</span>
              </td>
              <td class="py-md px-md">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full font-label-caps text-[10px] font-bold" :class="getStatusBadgeClass(item.status)">
                  {{ getThaiStatusText(item.status) }}
                </span>
              </td>
              <td class="py-md px-md font-body-md text-body-md text-on-surface-variant">{{ formatDate(item.date) }}</td>
              <td class="py-md px-md text-right">
                <button class="text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-surface-container-high" title="View Detail">
                  <span class="material-symbols-outlined text-[20px]">visibility</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination bar -->
      <div v-if="totalPages > 1" class="flex justify-between items-center p-md border-t border-surface-variant text-xs">
        <button 
          :disabled="page === 1" 
          class="bg-surface-container-lowest border border-surface-variant rounded-lg px-3 py-1.5 font-bold hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed" 
          @click="changePage(page - 1)">
          ◀ ก่อนหน้า
        </button>
        <span class="text-on-surface-variant">หน้า {{ page }} จาก {{ totalPages }} (ทั้งหมด {{ totalCases }} รายการ)</span>
        <button 
          :disabled="page === totalPages" 
          class="bg-surface-container-lowest border border-surface-variant rounded-lg px-3 py-1.5 font-bold hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed" 
          @click="changePage(page + 1)">
          ถัดไป ▶
        </button>
      </div>
    </div>

    <!-- Sliding Case Detail Drawer (F4) -->
    <div class="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-300" v-if="selectedCase" @click.self="closeDrawer">
      <div class="w-[450px] h-screen bg-surface-container-lowest shadow-2xl border-l border-surface-variant flex flex-col animate-slide-in">
        <!-- Drawer Header -->
        <div class="p-lg border-b border-surface-variant flex justify-between items-center bg-surface-container-low">
          <div>
            <span class="text-[10px] font-bold text-secondary tracking-widest block mb-0.5">CASE DOSSIER</span>
            <h3 class="font-headline-sm text-base text-primary font-bold">รายละเอียดเคส: {{ selectedCase.apt_id }}</h3>
          </div>
          <button class="text-on-surface-variant hover:text-on-surface text-2xl font-bold" @click="closeDrawer">×</button>
        </div>

        <!-- Drawer Body -->
        <div class="p-lg overflow-y-auto flex-grow flex flex-col gap-lg text-xs">
          <!-- Section: Patient details -->
          <div>
            <h4 class="font-headline-sm text-xs font-bold text-on-surface border-l-4 border-secondary pl-sm mb-md">👤 ข้อมูลผู้รับบริการ</h4>
            <div class="bg-surface border border-surface-variant p-md rounded-lg flex flex-col gap-sm">
              <div class="flex justify-between"><span class="text-on-surface-variant">ชื่อผู้ป่วย:</span><span class="font-bold text-on-surface">{{ selectedCase.patient_name }}</span></div>
              <div class="flex justify-between"><span class="text-on-surface-variant">รหัสผู้ใช้:</span><span>{{ selectedCase.user_id }}</span></div>
              <div class="flex justify-between"><span class="text-on-surface-variant">อีเมลติดต่อ:</span><span>{{ selectedCase.patient_email }}</span></div>
              <div class="flex justify-between"><span class="text-on-surface-variant">เบอร์โทรศัพท์:</span><span>{{ selectedCase.patient_phone }}</span></div>
            </div>
          </div>

          <!-- Section: Doctor & Hospital details -->
          <div>
            <h4 class="font-headline-sm text-xs font-bold text-on-surface border-l-4 border-secondary pl-sm mb-md">🏥 การรักษาและแพทย์ผู้ตรวจ</h4>
            <div class="bg-surface border border-surface-variant p-md rounded-lg flex flex-col gap-sm">
              <div class="flex justify-between"><span class="text-on-surface-variant">แพทย์ผู้รับตรวจ:</span><span class="font-bold text-on-surface">{{ selectedCase.doctor_name }}</span></div>
              <div class="flex justify-between"><span class="text-on-surface-variant">แผนกการรักษา:</span><span>{{ selectedCase.department }}</span></div>
              <div class="flex justify-between"><span class="text-on-surface-variant">พิกัดโรงพยาบาล:</span><span>{{ selectedCase.hospital }} ({{ getThaiCityName(selectedCase.city) }})</span></div>
              <div class="flex justify-between"><span class="text-on-surface-variant">รหัสหมอ:</span><span>{{ selectedCase.doctor_id }}</span></div>
            </div>
          </div>

          <!-- Section: Outbreak Symptoms report -->
          <div>
            <h4 class="font-headline-sm text-xs font-bold text-on-surface border-l-4 border-secondary pl-sm mb-md">🩺 รายงานอาการสำคัญ</h4>
            <div class="bg-error-container/30 border border-error/20 p-md rounded-lg flex gap-md items-start">
              <span class="material-symbols-outlined text-error text-[20px] mt-0.5">coronavirus</span>
              <div>
                <p class="font-bold text-error text-xs">{{ selectedCase.symptom }}</p>
                <p class="text-[10px] text-on-surface-variant mt-1">ได้รับการเฝ้าระวังภัยพิบัติทางสาธารณสุขเนื่องจากอยู่ในเกณฑ์โรคระบาดทางเดินหายใจ</p>
              </div>
            </div>
          </div>

          <!-- Section: Timeline tracker -->
          <div>
            <h4 class="font-headline-sm text-xs font-bold text-on-surface border-l-4 border-secondary pl-sm mb-md">⏳ ไทม์ไลน์สถานะประวัติการรักษา</h4>
            <div class="relative pl-md border-l-2 border-surface-variant ml-sm flex flex-col gap-lg">
              <!-- Step 1 -->
              <div class="relative">
                <span class="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-secondary"></span>
                <p class="font-bold text-on-surface">สร้างนัดหมายสำเร็จ (PENDING)</p>
                <p class="text-[10px] text-on-surface-variant">จองคิวนัดตรวจล่วงหน้าในระบบ Health Radar</p>
              </div>

              <!-- Step 2 -->
              <div class="relative">
                <span class="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full" :class="selectedCase.status !== 'PENDING' && selectedCase.status !== 'CANCELLED' ? 'bg-secondary' : 'bg-outline-variant'"></span>
                <p class="font-bold text-on-surface">ยืนยันวันรับตรวจ (CONFIRMED)</p>
                <p class="text-[10px] text-on-surface-variant">จัดสรรห้องวิเคราะห์แล็บและข้อมูลบุคลากรแพทย์</p>
              </div>

              <!-- Step 3 (Outcome status) -->
              <div class="relative">
                <span class="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full" :class="getTimelineOutcomeColor(selectedCase.status)"></span>
                <p class="font-bold text-on-surface">บทสรุปบริการ: {{ selectedCase.status }}</p>
                <p class="text-[10px] text-on-surface-variant">
                  {{ getStatusTimelineDesc(selectedCase.status) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

// API data states
const cases = ref([]);
const totalCases = ref(0);
const page = ref(1);
const totalPages = ref(1);
const loading = ref(true);
const selectedCase = ref(null);

const deptOptions = [
  'Psychiatry', 'Dermatology', 'Gynecology', 'Cardiology', 
  'Pediatrics', 'Urology', 'Neurology', 'Oncology', 'Orthopedics'
];

// Active Filters
const filters = reactive({
  search: '',
  city: '',
  status: '',
  department: ''
});

// Debounce helper
let debounceTimeout = null;
function debounceQuery() {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    page.value = 1;
    applyFilters();
  }, 300);
}

// Translate helpers
function getInitials(name) {
  if (!name) return 'JD';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

function getThaiCityName(city) {
  const map = {
    'Bangkok': 'กรุงเทพฯ',
    'Chiang Mai': 'เชียงใหม่',
    'Phuket': 'ภูเก็ต',
    'Khon Kaen': 'ขอนแก่น',
    'Chon Buri': 'ชลบุรี'
  };
  return map[city] || city;
}

function getThaiStatusText(status) {
  const map = {
    'COMPLETED': 'เสร็จสิ้น',
    'CONFIRMED': 'ยืนยันแล้ว',
    'PENDING': 'รอดำเนินการ',
    'CANCELLED': 'ยกเลิก',
    'NO_SHOW': 'เบี้ยวนัด'
  };
  return map[status] || status;
}

function getStatusBadgeClass(status) {
  if (status === 'COMPLETED') return 'bg-secondary-container text-on-secondary-container';
  if (status === 'CONFIRMED') return 'bg-primary-fixed text-on-primary-fixed-variant';
  if (status === 'PENDING') return 'bg-tertiary-fixed text-on-tertiary-fixed-variant';
  if (status === 'CANCELLED') return 'bg-surface-variant text-on-surface-variant';
  return 'bg-error-container text-on-error-container'; // NO_SHOW
}

function getTimelineOutcomeColor(status) {
  if (status === 'COMPLETED') return 'bg-secondary';
  if (status === 'NO_SHOW') return 'bg-error';
  if (status === 'CANCELLED') return 'bg-outline';
  if (status === 'CONFIRMED') return 'bg-secondary';
  return 'bg-tertiary-fixed-dim'; // PENDING
}

function getStatusTimelineDesc(status) {
  if (status === 'COMPLETED') return 'แพทย์ตรวจรักษาเสร็จสมบูรณ์ ปิดประวัติเวชระเบียนเสร็จสิ้น';
  if (status === 'NO_SHOW') return 'คนไข้ไม่เข้าพบแพทย์ตามเวลานัด ส่งผลต่อทรัพยากรคลินิก';
  if (status === 'CANCELLED') return 'คนไข้แจ้งขอยกเลิกเวลานัดล่วงหน้า';
  if (status === 'CONFIRMED') return 'ยืนยันตารางคิวตรวจ ดำเนินการรักษาในเร็วๆ นี้';
  return 'รอขั้นตอนคัดกรองเบื้องต้นลงฐานข้อมูลระบบ';
}

// Fetch lists
async function applyFilters() {
  loading.value = true;
  try {
    const data = await $fetch('/api/appointments', {
      query: {
        page: page.value,
        limit: 12,
        search: filters.search,
        city: filters.city,
        status: filters.status,
        department: filters.department
      }
    });
    
    if (data.success) {
      cases.value = data.items;
      totalCases.value = data.total;
      totalPages.value = data.totalPages;
    }
  } catch (error) {
    console.error('Failed to load explorer cases:', error);
  } finally {
    loading.value = false;
  }
}

function changePage(newPage) {
  if (newPage < 1 || newPage > totalPages.value) return;
  page.value = newPage;
  applyFilters();
}

function openCaseDetail(item) {
  selectedCase.value = item;
}

function closeDrawer() {
  selectedCase.value = null;
}

function resetFilters() {
  filters.search = '';
  filters.city = '';
  filters.status = '';
  filters.department = '';
  page.value = 1;
  applyFilters();
}

// Export data directly to CSV downloads (F3 Extra)
function exportToCSV() {
  if (!cases.value.length) return;

  const headers = ['รหัสเคส', 'ชื่อคนไข้', 'อาการหลัก', 'แพทย์ผู้รักษา', 'โรงพยาบาล', 'จังหวัด', 'สถานะ', 'วันที่/เวลา'];
  const rows = cases.value.map(item => [
    `#${item.apt_id}`,
    item.patient_name,
    item.symptom,
    item.doctor_name,
    item.hospital,
    getThaiCityName(item.city),
    item.status,
    formatDate(item.date)
  ]);

  const csvContent = "\uFEFF" + [
    headers.join(','),
    ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  // Trigger file download in browser
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `health_radar_export_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function formatDate(isoStr) {
  if (!isoStr) return '';
  const dateObj = new Date(isoStr);
  const formatted = dateObj.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: '2-digit'
  });
  const time = dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  return `${formatted} · ${time} น.`;
}

onMounted(() => {
  // Catch incoming redirect parameter filters from Outbreak Map or Search redirects
  if (route.query.city) {
    filters.city = route.query.city;
  }
  if (route.query.search) {
    filters.search = route.query.search;
  }
  applyFilters();
});
</script>

<style scoped>
.animate-slide-in {
  animation: slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.1) forwards;
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
</style>
