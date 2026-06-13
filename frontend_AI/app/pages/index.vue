<template>
  <div class="flex flex-col gap-lg">
    <!-- Hero Header & AI Banner -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-md mb-xs">
      <div>
        <h1 class="font-display-lg text-display-lg text-on-surface mb-xs">ภาพรวมการเฝ้าระวัง</h1>
        <p class="font-body-md text-body-md text-on-surface-variant" id="current-date">{{ formattedDate }}</p>
      </div>
      
      <!-- AI Outbreak Banner -->
      <div class="bg-error-container border border-error/20 rounded-lg p-sm flex items-start gap-sm max-w-lg shadow-sm">
        <span class="material-symbols-outlined text-on-error-container mt-0.5" style="font-variation-settings: 'FILL' 1;">warning</span>
        <div>
          <div class="font-label-caps text-label-caps text-on-error-container mb-1">แจ้งเตือนระบาดวิทยาอัตโนมัติ (AI Alert)</div>
          <div class="font-body-md text-body-md text-on-error-container font-medium">
            {{ autoSummary || 'ตรวจพบความผิดปกติ: อาการไข้หวัดใหญ่เพิ่มขึ้น 40% ในพื้นที่เชียงใหม่' }}
          </div>
        </div>
      </div>
    </div>

    <!-- 1. KPI Grid (5 Columns) -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-md mb-xs">
      <!-- Total Cases -->
      <div class="bg-surface-container-lowest rounded-xl p-md shadow-sm border border-surface-variant">
        <div class="font-label-caps text-label-caps text-on-surface-variant mb-sm flex items-center justify-between">
          เคสสะสมทั้งหมด
          <span class="material-symbols-outlined text-outline" style="font-size: 16px;">monitoring</span>
        </div>
        <div class="font-headline-md text-headline-md text-on-surface mb-1">{{ kpis.totalCases || 0 }}</div>
        <div class="font-body-md text-body-md text-secondary flex items-center gap-1 text-sm font-medium">
          <span class="material-symbols-outlined text-secondary" style="font-size: 14px;">trending_up</span>
          +12% <span class="text-on-surface-variant font-normal">จากสัปดาห์ที่แล้ว</span>
        </div>
      </div>

      <!-- Alert Level -->
      <div class="bg-surface-container-lowest rounded-xl p-md shadow-sm border border-surface-variant">
        <div class="font-label-caps text-label-caps text-on-surface-variant mb-sm flex items-center justify-between">
          ระดับการเตือนภัย
          <span class="material-symbols-outlined text-outline" style="font-size: 16px;">security</span>
        </div>
        <div class="font-headline-md text-headline-md text-on-surface mb-1 flex items-center gap-sm">
          <div class="w-3 h-3 rounded-full" :class="kpis.alertLevel === 'RED' ? 'bg-error' : 'bg-tertiary-fixed-dim'"></div>
          {{ kpis.alertLevel === 'RED' ? 'สีแดง (วิกฤต)' : 'สีเหลือง (เฝ้าระวัง)' }}
        </div>
        <div class="font-body-md text-body-md text-on-surface-variant text-xs">
          พบคลัสเตอร์หนาแน่นสัปดาห์นี้
        </div>
      </div>

      <!-- Trending Symptom -->
      <div class="bg-surface-container-lowest rounded-xl p-md shadow-sm border border-surface-variant">
        <div class="font-label-caps text-label-caps text-on-surface-variant mb-sm flex items-center justify-between">
          อาการมาแรง
          <span class="material-symbols-outlined text-outline" style="font-size: 16px;">coronavirus</span>
        </div>
        <div class="font-headline-md text-headline-md text-on-surface mb-1 text-base font-bold text-on-tertiary-container">
          {{ kpis.topSymptom || 'ไข้ / ไอ' }}
        </div>
        <div class="font-body-md text-body-md text-on-surface-variant text-xs">
          ตัวบ่งชี้การระบาดหลัก
        </div>
      </div>

      <!-- NO-SHOW Rate -->
      <div class="bg-surface-container-lowest rounded-xl p-md shadow-sm border border-surface-variant">
        <div class="font-label-caps text-label-caps text-on-surface-variant mb-sm flex items-center justify-between">
          อัตราไม่มาตามนัด
          <span class="material-symbols-outlined text-outline" style="font-size: 16px;">event_busy</span>
        </div>
        <div class="font-headline-md text-headline-md text-on-surface mb-1">{{ kpis.noShowRate || 0 }}%</div>
        <div class="font-body-md text-body-md text-secondary flex items-center gap-1 text-sm font-medium">
          <span class="material-symbols-outlined text-secondary" style="font-size: 14px;">trending_down</span>
          -0.5% <span class="text-on-surface-variant font-normal">จากค่าเฉลี่ย</span>
        </div>
      </div>

      <!-- Cities Monitored -->
      <div class="bg-surface-container-lowest rounded-xl p-md shadow-sm border border-surface-variant">
        <div class="font-label-caps text-label-caps text-on-surface-variant mb-sm flex items-center justify-between">
          เมืองที่เฝ้าระวัง
          <span class="material-symbols-outlined text-outline" style="font-size: 16px;">location_city</span>
        </div>
        <div class="font-headline-md text-headline-md text-on-surface mb-1">{{ kpis.activeCitiesCount || 5 }}</div>
        <div class="font-body-md text-body-md text-on-surface-variant text-xs">
          จุดเฝ้าระวังที่เชื่อมต่อ
        </div>
      </div>
    </div>

    <!-- 2. Leaflet Map & AI Analyst (Side by Side Row) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-md items-start">
      <!-- Outbreak Geographical Map Card (8 Cols) -->
      <div class="lg:col-span-7 h-full">
        <!-- Render Leaflet Map dynamically inside client -->
        <ClientOnly>
          <LeafletMap 
            :hotspots="hotspots" 
            @select-city="handleSelectCity" />
        </ClientOnly>
      </div>

      <!-- AI Outbreak Analyst Chat & Province Details Console (5 Cols) -->
      <div class="lg:col-span-5 flex flex-col gap-md">
        <!-- Province Detail Drawer Card -->
        <div v-if="selectedCityData" class="bg-surface-container-lowest rounded-xl p-md shadow-sm border border-secondary/40">
          <div class="flex justify-between items-center mb-md border-b border-surface-variant pb-xs">
            <h3 class="font-headline-sm text-base text-primary font-bold">📊 คลัสเตอร์ระบาด: {{ selectedCityData.city }}</h3>
            <button class="text-on-surface-variant hover:text-on-surface text-xl font-bold" @click="selectedCityData = null">×</button>
          </div>
          <div class="flex flex-col gap-sm text-sm">
            <div class="flex justify-between">
              <span class="text-on-surface-variant">ยอดเคสทั้งหมด:</span>
              <span class="font-bold text-on-surface">{{ selectedCityData.totalCases }} ราย</span>
            </div>
            <div class="flex justify-between">
              <span class="text-on-surface-variant">เคส Active (กำลังรักษา):</span>
              <span class="font-bold text-secondary">{{ selectedCityData.activeCases }} ราย</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-on-surface-variant">ประเมินความรุนแรง:</span>
              <span class="px-2 py-0.5 rounded text-xs font-bold" :class="selectedCityData.severity === 'high' ? 'bg-error-container text-on-error-container' : 'bg-secondary-container text-on-secondary-container'">
                {{ selectedCityData.severity === 'high' ? 'วิกฤต/ระบาดหนัก' : 'ปกติ-ปานกลาง' }}
              </span>
            </div>
            <div class="mt-sm bg-surface-container-low p-sm rounded-lg">
              <div class="font-bold text-xs text-on-surface mb-sm">กลุ่มอาการที่พบบ่อยที่สุด:</div>
              <ul class="list-disc list-inside text-xs text-on-surface-variant flex flex-col gap-1">
                <li v-for="(sym, idx) in selectedCityData.topSymptoms" :key="idx">{{ sym }}</li>
              </ul>
            </div>
            <button @click="investigateCity(selectedCityData.city)" class="w-full bg-secondary text-on-secondary py-2 rounded-lg font-label-caps text-xs font-bold hover:opacity-95 mt-sm">
              🔎 เจาะลึกเคสใน {{ selectedCityData.city }}
            </button>
          </div>
        </div>

        <!-- AI Analyst Console -->
        <div class="bg-surface-container-lowest rounded-xl p-md shadow-sm border border-surface-variant flex flex-col h-[400px]">
          <div class="flex items-center gap-sm mb-md border-b border-surface-variant pb-xs">
            <span class="text-xl">🤖</span>
            <div>
              <h3 class="font-headline-sm text-base text-on-surface font-bold">AI Analyst Console</h3>
              <p class="text-[10px] text-on-surface-variant">Gemini ระบาดวิทยาปัญญาประดิษฐ์</p>
            </div>
          </div>
          
          <!-- Chat area -->
          <div class="flex-1 overflow-y-auto pr-sm flex flex-col gap-sm mb-sm text-xs" ref="chatLogsRef">
            <!-- Initial AI summary welcome message -->
            <div class="bg-surface-container p-sm rounded-lg text-on-surface-variant border border-surface-variant leading-relaxed">
              <strong>💡 บทสรุปวิเคราะห์โรคระบาดอัตโนมัติ:</strong> <br />
              {{ autoSummary || 'กำลังสรุปผลสถิติโรคระบาดประจำวัน...' }}
            </div>

            <!-- Chat message loops -->
            <div v-for="(msg, idx) in chatHistory" :key="idx" class="p-sm rounded-lg flex flex-col max-w-[85%] leading-relaxed" :class="msg.role === 'user' ? 'bg-primary-container text-on-primary-fixed self-end border border-surface-variant' : 'bg-surface border border-surface-variant self-start'">
              <span class="text-[10px] font-bold text-outline mb-1">{{ msg.role === 'user' ? 'คุณหมอแนน' : 'Analyst 🤖' }}</span>
              <p v-html="formatMarkdown(msg.text)"></p>
            </div>

            <!-- Thinking state loader -->
            <div v-if="loadingChat" class="bg-surface border border-surface-variant p-sm rounded-lg self-start flex items-center gap-1.5 text-outline">
              <span>🤖 กำลังประมวลผลข้อมูล</span>
              <span class="animate-bounce">.</span><span class="animate-bounce" style="animation-delay: 0.2s">.</span><span class="animate-bounce" style="animation-delay: 0.4s">.</span>
            </div>
          </div>

          <!-- Chat inputs -->
          <form class="flex gap-sm border-t border-surface-variant pt-sm" @submit.prevent="sendAiMessage">
            <input 
              v-model="aiQuery" 
              type="text" 
              placeholder="ถามเจาะลึกคลัสเตอร์ เช่น 'ภูเก็ตระบาดโรคอะไร?'" 
              class="flex-1 bg-surface-container-low border border-surface-variant rounded-lg px-sm py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
              :disabled="loadingChat" />
            <button type="submit" class="bg-primary text-on-primary px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-90" :disabled="loadingChat || !aiQuery.trim()">
              ส่ง ⚡
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- 3. Trend & Recent Alerts Row (Bento Grid layout) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-md">
      <!-- Main Trend chart (8 Cols) -->
      <div class="lg:col-span-8">
        <SymptomChart type="line" :data="trend" />
      </div>

      <!-- Recent Alerts (4 Cols) -->
      <div class="lg:col-span-4 bg-surface-container-lowest rounded-xl p-md shadow-sm border border-surface-variant flex flex-col">
        <div class="flex items-center justify-between mb-md border-b border-surface-variant pb-sm">
          <h3 class="font-headline-sm text-headline-sm text-on-surface flex items-center gap-sm">
            <span class="material-symbols-outlined text-error" style="font-variation-settings: 'FILL' 1;">cell_tower</span>
            การแจ้งเตือนล่าสุด
          </h3>
          <span class="bg-error-container text-on-error-container font-label-caps text-[10px] px-2 py-1 rounded-full">สด</span>
        </div>

        <!-- Alerts log list -->
        <div class="flex-1 flex flex-col gap-sm overflow-y-auto pr-1" style="max-height: 300px;">
          <!-- Alert Item 1 (Dynamic Live Pings indicator) -->
          <div v-if="lastPingText" class="p-sm rounded-lg bg-surface-container border border-secondary/40 cursor-pointer animate-pulse">
            <div class="flex justify-between items-start mb-1">
              <div class="font-label-caps text-label-caps text-secondary font-bold">LIVE PING DETECTED</div>
              <div class="font-data-mono text-data-mono text-on-surface-variant text-xs">เมื่อกี้</div>
            </div>
            <div class="font-body-md text-body-md text-on-surface font-medium mb-1">{{ lastPingText }}</div>
            <div class="font-body-md text-body-md text-on-surface-variant text-xs flex items-center gap-1">
              <span class="material-symbols-outlined text-outline" style="font-size: 14px;">location_on</span>
              ตรวจจับโดยระบบดาวเทียม
            </div>
          </div>

          <!-- Alert Item 2 -->
          <div class="p-sm rounded-lg bg-surface hover:bg-surface-variant transition-colors border border-surface-variant cursor-pointer group">
            <div class="flex justify-between items-start mb-1">
              <div class="font-label-caps text-label-caps text-error font-bold">แจ้งเตือนด่วน</div>
              <div class="font-data-mono text-data-mono text-on-surface-variant text-xs">2 นาทีที่แล้ว</div>
            </div>
            <div class="font-body-md text-body-md text-on-surface font-medium mb-1 group-hover:text-secondary transition-colors">กลุ่มก้อน: ผื่นไม่ทราบสาเหตุ</div>
            <div class="font-body-md text-body-md text-on-surface-variant text-xs flex items-center gap-1">
              <span class="material-symbols-outlined text-outline" style="font-size: 14px;">location_on</span>
              เขต 4, เชียงใหม่
            </div>
          </div>

          <!-- Alert Item 3 -->
          <div class="p-sm rounded-lg bg-surface hover:bg-surface-variant transition-colors border border-surface-variant cursor-pointer group">
            <div class="flex justify-between items-start mb-1">
              <div class="font-label-caps text-label-caps text-on-tertiary-container font-bold">ระดับสูง</div>
              <div class="font-data-mono text-data-mono text-on-surface-variant text-xs">15 นาทีที่แล้ว</div>
            </div>
            <div class="font-body-md text-body-md text-on-surface font-medium mb-1 group-hover:text-secondary transition-colors">ยอดเคสไข้เลือดออกพุ่งสูง</div>
            <div class="font-body-md text-body-md text-on-surface-variant text-xs flex items-center gap-1">
              <span class="material-symbols-outlined text-outline" style="font-size: 14px;">location_on</span>
              บางซื่อ, กรุงเทพฯ
            </div>
          </div>

          <!-- Alert Item 4 -->
          <div class="p-sm rounded-lg bg-surface hover:bg-surface-variant transition-colors border border-surface-variant cursor-pointer group opacity-70">
            <div class="flex justify-between items-start mb-1">
              <div class="font-label-caps text-label-caps text-on-surface-variant">แก้ไขแล้ว</div>
              <div class="font-data-mono text-data-mono text-on-surface-variant text-xs">3 ชม. ที่แล้ว</div>
            </div>
            <div class="font-body-md text-body-md text-on-surface font-medium mb-1 group-hover:text-primary transition-colors line-through">ตรวจจับ: ระบบล่ม Lab API</div>
          </div>
        </div>
        
        <NuxtLink to="/explorer" class="mt-sm w-full py-2 text-center font-label-caps text-label-caps text-primary hover:bg-surface-variant rounded transition-colors text-xs font-bold block border border-surface-variant">
          ดูบันทึกทั้งหมด
        </NuxtLink>
      </div>
    </div>

    <!-- 4. Donut Chart & Bar Chart (Composition row) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-md">
      <!-- Donut composition (6 Cols) -->
      <div class="lg:col-span-6">
        <SymptomChart type="donut" :data="topSymptoms" />
      </div>
      
      <!-- Bar composition (6 Cols) -->
      <div class="lg:col-span-6">
        <SymptomChart type="bar" :bar-data="barChartData" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useState } from '#app';
import LeafletMap from '~/components/LeafletMap.vue';
import SymptomChart from '~/components/SymptomChart.vue';

const router = useRouter();

// API database states
const kpis = ref({});
const hotspots = ref([]);
const trend = ref([]);
const topSymptoms = ref([]);
const rawAppointments = ref([]);

// UI states
const selectedCityData = ref(null);
const aiQuery = ref('');
const autoSummary = ref('');
const loadingSummary = ref(true);
const loadingChat = ref(false);
const chatHistory = ref([]);
const chatLogsRef = ref(null);
const lastPingText = ref('');

// Global real-time state triggers
const activePingCity = useState('active-ping-city');

// Date Formatter
const formattedDate = computed(() => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return new Date('2026-06-13T10:00:00Z').toLocaleDateString('th-TH', options);
});

// Dynamic Bar Chart mapping from appointments statuses
const barChartData = computed(() => {
  if (!rawAppointments.value.length) {
    return { confirmed: 85, cancelled: 12, noshow: 4 }; // fallback defaults
  }
  
  const confirmed = rawAppointments.value.filter(
    a => a.status === 'CONFIRMED' || a.status === 'PENDING'
  ).length;
  
  const cancelled = rawAppointments.value.filter(
    a => a.status === 'CANCELLED'
  ).length;
  
  const noshow = rawAppointments.value.filter(
    a => a.status === 'NO_SHOW'
  ).length;

  return { confirmed, cancelled, noshow };
});

// Fetch stats and full appointments for bar charting
async function fetchStats() {
  try {
    const statsData = await $fetch('/api/stats');
    if (statsData.success) {
      kpis.value = statsData.kpis;
      hotspots.value = statsData.hotspots;
      trend.value = statsData.trend;
      topSymptoms.value = statsData.topSymptoms;
      
      // Update selected city stats if visible
      if (selectedCityData.value) {
        const found = statsData.hotspots.find(h => h.city === selectedCityData.value.city);
        if (found) selectedCityData.value = found;
      }
    }

    // Fetch raw cases to build dynamic bar charts
    const casesData = await $fetch('/api/appointments', { query: { limit: 400 } });
    if (casesData.success) {
      rawAppointments.value = casesData.items;
    }
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

// Fetch automatic Gemini epidemiological warning on load
async function fetchAutoSummary() {
  loadingSummary.value = true;
  try {
    const data = await $fetch('/api/analyst', {
      method: 'POST',
      body: { isAutoSummary: true }
    });
    autoSummary.value = data.response;
  } catch (err) {
    autoSummary.value = 'ไม่สามารถดึงข้อมูลบทสรุปเตือนภัยอัตโนมัติได้';
  } finally {
    loadingSummary.value = false;
  }
}

function handleSelectCity(cityData) {
  selectedCityData.value = cityData;
}

// Search coordinates parameters redirects
function investigateCity(cityName) {
  router.push({
    path: '/explorer',
    query: { city: cityName }
  });
}

// Chat prompt with Gemini
async function sendAiMessage() {
  if (!aiQuery.value.trim() || loadingChat.value) return;

  const query = aiQuery.value;
  chatHistory.value.push({ role: 'user', text: query });
  aiQuery.value = '';
  loadingChat.value = true;
  scrollToBottom();

  try {
    const data = await $fetch('/api/analyst', {
      method: 'POST',
      body: { message: query }
    });
    chatHistory.value.push({ role: 'analyst', text: data.response });
  } catch (err) {
    chatHistory.value.push({
      role: 'analyst',
      text: 'ขออภัยครับ เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย AI'
    });
  } finally {
    loadingChat.value = false;
    scrollToBottom();
  }
}

function scrollToBottom() {
  setTimeout(() => {
    if (chatLogsRef.value) {
      chatLogsRef.value.scrollTop = chatLogsRef.value.scrollHeight;
    }
  }, 100);
}

function formatMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-surface-container px-1 py-0.5 rounded text-[11px]">$1</code>')
    .replace(/\n/g, '<br />');
}

// Monitor real-time pings to trigger stats reload and recent alerts updates
watch(activePingCity, (newCity) => {
  if (newCity) {
    lastPingText.value = `ตรวจพบอาการเจ็บป่วยเข้าสู่พิกัด "${newCity}"`;
    fetchStats();
    
    // Auto-clear pings indicator after 8 seconds
    setTimeout(() => {
      lastPingText.value = '';
    }, 8000);
  }
});

onMounted(() => {
  fetchStats();
  fetchAutoSummary();
});
</script>

<style scoped>
.font-data-mono {
  font-family: var(--font-body);
  font-weight: 500;
}
</style>
