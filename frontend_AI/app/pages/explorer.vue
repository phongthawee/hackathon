<template>
  <div class="explorer-page">
    <header class="explorer-header">
      <div>
        <h1 class="page-title">Case Explorer</h1>
        <p class="page-subtitle">ค้นหา ตรวจสอบ และคัดกรองประวัตินัดตรวจสุขภาพระดับภูมิภาคเชิงลึก</p>
      </div>
    </header>

    <!-- Filters Section -->
    <div class="filters-panel glass-panel">
      <div class="filter-row-top">
        <!-- Text Search -->
        <div class="filter-group search-box">
          <label>ค้นหาประวัติ</label>
          <div class="input-wrapper">
            <input 
              v-model="filters.search" 
              type="text" 
              placeholder="ค้นหา ID, ชื่อผู้ป่วย, อาการ หรือแพทย์..." 
              @input="debounceQuery" />
            <span v-if="filters.search" class="clear-btn" @click="clearSearch">×</span>
          </div>
        </div>
      </div>

      <div class="filter-row-bottom">
        <!-- City Select -->
        <div class="filter-group">
          <label>จังหวัด</label>
          <select v-model="filters.city" @change="applyFilters">
            <option value="">ทั้งหมด</option>
            <option value="Bangkok">กรุงเทพฯ</option>
            <option value="Chiang Mai">เชียงใหม่</option>
            <option value="Phuket">ภูเก็ต</option>
            <option value="Khon Kaen">ขอนแก่น</option>
            <option value="Chon Buri">ชลบุรี</option>
          </select>
        </div>

        <!-- Symptom Select -->
        <div class="filter-group">
          <label>กลุ่มอาการ</label>
          <select v-model="filters.symptom" @change="applyFilters">
            <option value="">ทั้งหมด</option>
            <option v-for="sym in symptomOptions" :key="sym" :value="sym">{{ sym }}</option>
          </select>
        </div>

        <!-- Status Select -->
        <div class="filter-group">
          <label>สถานะนัดตรวจ</label>
          <select v-model="filters.status" @change="applyFilters">
            <option value="">ทั้งหมด</option>
            <option value="COMPLETED">COMPLETED (รักษาแล้ว)</option>
            <option value="CONFIRMED">CONFIRMED (ยืนยันแล้ว)</option>
            <option value="PENDING">PENDING (รอดำเนินการ)</option>
            <option value="CANCELLED">CANCELLED (ยกเลิก)</option>
            <option value="NO_SHOW">NO_SHOW (เบี้ยวนัด)</option>
          </select>
        </div>

        <!-- Department Select -->
        <div class="filter-group">
          <label>แผนกการรักษา</label>
          <select v-model="filters.department" @change="applyFilters">
            <option value="">ทั้งหมด</option>
            <option v-for="dept in deptOptions" :key="dept" :value="dept">{{ dept }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Data Table Section -->
    <div class="table-panel glass-panel">
      <div v-if="loading" class="table-loading">
        <p class="loading-pulse">🔄 กำลังโหลดข้อมูลประวัติเคส...</p>
      </div>

      <div v-else-if="!cases.length" class="empty-state">
        <p>ไม่พบประวัติข้อมูลนัดตรวจตรวจที่ตรงกับเงื่อนไข</p>
        <button class="reset-btn" @click="resetFilters">ล้างตัวกรองทั้งหมด</button>
      </div>

      <div v-else class="table-responsive">
        <table class="cases-table">
          <thead>
            <tr>
              <th>ID เคส</th>
              <th>วันที่รับบริการ</th>
              <th>ชื่อคนไข้</th>
              <th>กลุ่มอาการ</th>
              <th>แพทย์ผู้ตรวจ</th>
              <th>โรงพยาบาล (จังหวัด)</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="item in cases" 
              :key="item.apt_id" 
              class="table-row" 
              :class="{ 'row-active': selectedCase?.apt_id === item.apt_id }"
              @click="openCaseDetail(item)">
              <td class="case-id">{{ item.apt_id }}</td>
              <td>{{ formatDate(item.date) }}</td>
              <td class="bold">{{ item.patient_name }}</td>
              <td class="symptom-tag">{{ item.symptom }}</td>
              <td>{{ item.doctor_name }}</td>
              <td>{{ item.hospital }} <span class="city-sub">({{ item.city }})</span></td>
              <td>
                <span class="status-badge" :class="'badge-' + item.status">
                  {{ item.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination bar -->
      <div v-if="totalPages > 1" class="pagination-bar">
        <button 
          :disabled="page === 1" 
          class="pag-btn" 
          @click="changePage(page - 1)">
          ◀ ก่อนหน้า
        </button>
        <span class="pag-info">หน้า {{ page }} จาก {{ totalPages }} (ทั้งหมด {{ totalCases }} เคส)</span>
        <button 
          :disabled="page === totalPages" 
          class="pag-btn" 
          @click="changePage(page + 1)">
          ถัดไป ▶
        </button>
      </div>
    </div>

    <!-- Sliding Case Detail Drawer (F4) -->
    <div class="drawer-overlay" v-if="selectedCase" @click.self="closeDrawer">
      <div class="detail-drawer glass-panel" :class="{ 'drawer-open': selectedCase }">
        <div class="drawer-header">
          <div>
            <span class="drawer-tag">CASE DOSSIER</span>
            <h3>รายละเอียดเคส: {{ selectedCase.apt_id }}</h3>
          </div>
          <button class="drawer-close" @click="closeDrawer">×</button>
        </div>

        <div class="drawer-body" v-if="selectedCase">
          <!-- Patient Segment -->
          <div class="drawer-section">
            <h4>👤 ข้อมูลผู้รับบริการ</h4>
            <div class="drawer-grid">
              <div class="grid-cell"><span class="lbl">ชื่อ-สกุล:</span><span class="val bold">{{ selectedCase.patient_name }}</span></div>
              <div class="grid-cell"><span class="lbl">รหัสผู้ป่วย:</span><span class="val">{{ selectedCase.user_id }}</span></div>
              <div class="grid-cell"><span class="lbl">อีเมลติดต่อ:</span><span class="val">{{ selectedCase.patient_email }}</span></div>
              <div class="grid-cell"><span class="lbl">เบอร์โทรศัพท์:</span><span class="val">{{ selectedCase.patient_phone }}</span></div>
            </div>
          </div>

          <!-- Clinical Segment -->
          <div class="drawer-section">
            <h4>🏥 การวินิจฉัยและแพทย์ผู้รักษา</h4>
            <div class="drawer-grid">
              <div class="grid-cell"><span class="lbl">แพทย์ผู้รักษา:</span><span class="val bold">{{ selectedCase.doctor_name }}</span></div>
              <div class="grid-cell"><span class="lbl">แผนกแพทย์:</span><span class="val">{{ selectedCase.department }}</span></div>
              <div class="grid-cell"><span class="lbl">พิกัดโรงพยาบาล:</span><span class="val">{{ selectedCase.hospital }} ({{ selectedCase.city }})</span></div>
              <div class="grid-cell"><span class="lbl">รหัสแพทย์:</span><span class="val">{{ selectedCase.doctor_id }}</span></div>
            </div>
          </div>

          <!-- Outbreak Symptom details -->
          <div class="drawer-section">
            <h4>🩺 รายงานอาการสำคัญ</h4>
            <div class="symptom-box">
              <span class="symptom-indicator"></span>
              <div>
                <p class="symptom-title">{{ selectedCase.symptom }}</p>
                <p class="symptom-desc">ส่งตรวจผ่านระบบระบาดวิทยาเพื่อตรวจจับความผิดปกติของโรคติดต่อ</p>
              </div>
            </div>
          </div>

          <!-- Timeline status track -->
          <div class="drawer-section">
            <h4>⏳ ไทม์ไลน์สถานะการเข้ารับบริการ</h4>
            <div class="timeline">
              <div class="timeline-item done">
                <div class="t-line"></div>
                <div class="t-dot"></div>
                <div class="t-content">
                  <p class="t-title">สร้างนัดหมายสำเร็จ (PENDING)</p>
                  <p class="t-time">ประเมินอาการเบื้องต้นผ่านระบบ</p>
                </div>
              </div>
              
              <div class="timeline-item" :class="{ done: selectedCase.status !== 'PENDING' && selectedCase.status !== 'CANCELLED' }">
                <div class="t-line"></div>
                <div class="t-dot"></div>
                <div class="t-content">
                  <p class="t-title">ยืนยันเวลานัดตรวจ (CONFIRMED)</p>
                  <p class="t-time">จัดสรรแพทย์ผู้รักษาล่วงหน้า</p>
                </div>
              </div>

              <div class="timeline-item last" :class="selectedCase.status.toLowerCase()">
                <div class="t-dot"></div>
                <div class="t-content">
                  <p class="t-title">บทสรุปบริการ: {{ selectedCase.status }}</p>
                  <p class="t-time">
                    {{ getStatusTimelineDesc(selectedCase.status) }}
                  </p>
                </div>
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

// Dropdown lists filters
const symptomOptions = [
  'Flu symptoms', 'Sore throat', 'Diarrhea', 'Food Poisoning', 
  'Dengue Fever', 'Covid-19', 'Allergy', 'Headache', 'Back pain', 
  'Toothache', 'Stomach ache', 'Pregnancy checkup', 'Vaccination', 
  'Annual Checkup', 'Dizziness', 'Skin rash'
];

const deptOptions = [
  'Psychiatry', 'Dermatology', 'Gynecology', 'Cardiology', 
  'Pediatrics', 'Urology', 'Neurology', 'Oncology', 'Orthopedics'
];

// Active Filters
const filters = reactive({
  search: '',
  city: '',
  symptom: '',
  status: '',
  department: ''
});

// Debounce state for search input
let debounceTimeout = null;
function debounceQuery() {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    page.value = 1;
    applyFilters();
  }, 300);
}

function clearSearch() {
  filters.search = '';
  applyFilters();
}

// Format timeline description
function getStatusTimelineDesc(status) {
  if (status === 'COMPLETED') return 'แพทย์ตรวจรักษาเสร็จสมบูรณ์ ปิดประวัติเวชระเบียนเรียบร้อย';
  if (status === 'NO_SHOW') return 'ผู้ป่วยไม่เข้าพบแพทย์ตามเวลานัด เสียอัตราโควต้าสาธารณสุข';
  if (status === 'CANCELLED') return 'ผู้ป่วยขอยกเลิกนัดล่วงหน้าเนื่องจากไม่สะดวกเข้าพบ';
  if (status === 'CONFIRMED') return 'อยู่ระหว่างจัดเตรียมบุคลากรการรักษา';
  return 'รอเจ้าหน้าที่ทำความสะอาดยืนยันการลงทะเบียน';
}

// API fetch query runner
async function applyFilters() {
  loading.value = true;
  try {
    const data = await $fetch('/api/appointments', {
      query: {
        page: page.value,
        limit: 12,
        search: filters.search,
        city: filters.city,
        symptom: filters.symptom,
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
  filters.symptom = '';
  filters.status = '';
  filters.department = '';
  page.value = 1;
  applyFilters();
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
  // Read incoming query parameter from Outbreak Map redirection (if any)
  if (route.query.city) {
    filters.city = route.query.city;
  }
  applyFilters();
});
</script>

<style scoped>
.explorer-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.explorer-header {
  margin-bottom: 8px;
}

.page-title {
  font-family: var(--font-title);
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  background: linear-gradient(to right, #ffffff, #9ca3af);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-subtitle {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* Filters Panel */
.filters-panel {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-row-top {
  width: 100%;
}

.filter-row-bottom {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-group label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.input-wrapper {
  position: relative;
  width: 100%;
}

.filter-group input, .filter-group select {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-glow);
  color: var(--text-primary);
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.8rem;
  width: 100%;
}

.filter-group input:focus, .filter-group select:focus {
  outline: none;
  border-color: var(--color-blue);
  box-shadow: 0 0 8px rgba(6, 182, 212, 0.2);
}

.clear-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
}

/* Data Table Grid */
.table-panel {
  padding: 24px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.table-loading, .empty-state {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.reset-btn {
  margin-top: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-glow);
  color: var(--text-primary);
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.table-responsive {
  overflow-x: auto;
  margin-bottom: 20px;
}

.cases-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.8rem;
}

.cases-table th {
  padding: 12px 16px;
  font-family: var(--font-title);
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-glow);
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.05em;
}

.cases-table td {
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.02);
}

.table-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.table-row:hover, .table-row.row-active {
  background-color: rgba(255, 255, 255, 0.02);
}

.case-id {
  font-family: var(--font-title);
  font-weight: bold;
  color: var(--color-blue);
}

.bold {
  font-weight: 700;
}

.symptom-tag {
  color: var(--color-yellow);
  font-weight: 500;
}

.city-sub {
  color: var(--text-muted);
}

/* Status Badges */
.status-badge {
  display: inline-flex;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 800;
}

.badge-COMPLETED { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); color: var(--color-green); }
.badge-CONFIRMED { background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.3); color: var(--color-blue); }
.badge-PENDING { background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); color: var(--color-yellow); }
.badge-CANCELLED { background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-glow); color: var(--text-secondary); }
.badge-NO_SHOW { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: var(--color-red); }

/* Pagination */
.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.02);
}

.pag-btn {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-glow);
  color: var(--text-primary);
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: opacity 0.2s;
}

.pag-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.pag-info {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

/* Sliding Drawer Overlay */
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 999;
  display: flex;
  justify-content: flex-end;
}

.detail-drawer {
  width: 460px;
  height: 100vh;
  border-radius: 0;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.drawer-header {
  padding: 24px;
  border-bottom: 1px solid var(--border-glow);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.drawer-tag {
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--color-blue);
  letter-spacing: 0.15em;
  display: block;
  margin-bottom: 4px;
}

.drawer-header h3 {
  font-family: var(--font-title);
  font-size: 1.15rem;
  font-weight: 700;
}

.drawer-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.75rem;
  cursor: pointer;
}

.drawer-body {
  padding: 24px;
  overflow-y: auto;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.drawer-section h4 {
  font-family: var(--font-title);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
  border-left: 3px solid var(--color-blue);
  padding-left: 8px;
}

.drawer-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  background: rgba(255, 255, 255, 0.01);
  padding: 14px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.02);
}

.grid-cell {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
}

.lbl {
  color: var(--text-secondary);
}

.val {
  color: var(--text-primary);
}

/* Symptom Box detail */
.symptom-box {
  background: rgba(245, 158, 11, 0.03);
  border: 1px solid rgba(245, 158, 11, 0.15);
  border-radius: 8px;
  padding: 14px;
  display: flex;
  gap: 12px;
}

.symptom-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-yellow);
  box-shadow: 0 0 6px var(--color-yellow);
  margin-top: 6px;
}

.symptom-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-yellow);
}

.symptom-desc {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* Timeline component */
.timeline {
  display: flex;
  flex-direction: column;
  padding-left: 8px;
  margin-top: 8px;
}

.timeline-item {
  position: relative;
  padding-left: 24px;
  padding-bottom: 20px;
}

.t-line {
  position: absolute;
  top: 14px;
  left: 5px;
  width: 2px;
  height: 100%;
  background: rgba(255, 255, 255, 0.05);
  z-index: 1;
}

.timeline-item.done .t-line {
  background: var(--color-blue);
}

.t-dot {
  position: absolute;
  top: 4px;
  left: 1px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 2px stroke rgba(255, 255, 255, 0.2);
  z-index: 2;
}

.timeline-item.done .t-dot {
  background: var(--color-blue);
  box-shadow: 0 0 6px var(--color-blue);
}

.timeline-item.last .t-dot {
  background: var(--text-muted);
}

.timeline-item.last.completed .t-dot { background: var(--color-green); box-shadow: 0 0 6px var(--color-green); }
.timeline-item.last.no_show .t-dot { background: var(--color-red); box-shadow: 0 0 6px var(--color-red); }
.timeline-item.last.cancelled .t-dot { background: var(--text-muted); }
.timeline-item.last.confirmed .t-dot { background: var(--color-blue); }
.timeline-item.last.pending .t-dot { background: var(--color-yellow); }

.t-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-primary);
}

.t-time {
  font-size: 0.7rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.loading-pulse {
  animation: pulse-op 1.5s infinite alternate;
}
</style>
