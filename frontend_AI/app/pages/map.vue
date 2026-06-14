<template>
  <div class="flex-grow flex flex-col relative w-full h-full overflow-hidden bg-surface-dim">
    
    <!-- TopNavBar (Page Specific) -->
    <header class="bg-surface-bright dark:bg-inverse-surface flex justify-between items-center w-full px-lg py-md sticky top-0 z-30 shadow-sm border-b border-surface-container transition-all duration-200">
      <!-- Context/Title -->
      <div class="flex items-center gap-md">
        <h1 class="font-headline-md text-headline-md text-on-surface">แผนที่สดระดับภูมิภาค</h1>
        <span class="bg-secondary-container text-on-secondary-container px-2 py-1 rounded font-label-caps text-label-caps flex items-center gap-1">
          <span class="w-2 h-2 rounded-full bg-secondary animate-pulse"></span> สด
        </span>
      </div>
      
      <!-- Search & Actions -->
      <div class="flex items-center gap-lg">
        <div class="relative hidden lg:block w-64">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
          <input 
            v-model="searchQuery" 
            @keyup.enter="handleSearchSearch"
            class="w-full bg-surface-container-low border border-outline-variant rounded-full py-1.5 pl-10 pr-4 font-body-md text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-xs" 
            placeholder="ค้นหาภูมิภาคหรือรหัส..." 
            type="text"
          />
        </div>
        <div class="flex items-center gap-sm">
          <button class="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors relative">
            <span class="material-symbols-outlined">notifications</span>
            <span class="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border border-surface-bright"></span>
          </button>
          <button @click="router.push('/')" class="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors" title="ดูแดชบอร์ด/AI Analyst">
            <span class="material-symbols-outlined">smart_toy</span>
          </button>
          <button class="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors md:hidden">
            <span class="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Canvas Content Area -->
    <div class="flex-1 relative overflow-hidden bg-surface-dim">
      
      <!-- 1. Floating Filter Bar (Floating over map) -->
      <div class="absolute top-md left-md right-md z-20 flex gap-sm overflow-x-auto scroll-hidden pb-2 max-w-[calc(100%-40px)]">
        <!-- Symptoms Filter -->
        <div class="bg-surface-container-lowest shadow-sm rounded-lg border border-outline-variant flex items-center px-sm py-1 min-w-max">
          <span class="material-symbols-outlined text-outline mr-2 text-[18px]">filter_list</span>
          <span class="font-label-caps text-label-caps text-on-surface mr-2 font-bold text-xs">กลุ่มอาการ:</span>
          <select v-model="filters.symptom" @change="applyFilters" class="bg-transparent border-none font-body-md text-xs text-primary focus:ring-0 py-1 pl-0 pr-6 cursor-pointer">
            <option value="">ทุกกลุ่มอาการ</option>
            <option value="Dengue Fever">ไข้เลือดออก</option>
            <option value="Flu symptoms">ไข้หวัดใหญ่</option>
            <option value="Food Poisoning">อาหารเป็นพิษ</option>
          </select>
        </div>

        <!-- Time duration Filter -->
        <div class="bg-surface-container-lowest shadow-sm rounded-lg border border-outline-variant flex items-center px-sm py-1 min-w-max">
          <span class="material-symbols-outlined text-outline mr-2 text-[18px]">calendar_today</span>
          <select v-model="filters.duration" @change="applyFilters" class="bg-transparent border-none font-body-md text-xs text-primary focus:ring-0 py-1 pl-0 pr-6 cursor-pointer">
            <option value="7">7 วันที่ผ่านมา</option>
            <option value="1">24 ชั่วโมงล่าสุด</option>
            <option value="30">30 วันที่ผ่านมา</option>
          </select>
        </div>

        <!-- Region Filter -->
        <div class="bg-surface-container-lowest shadow-sm rounded-lg border border-outline-variant flex items-center px-sm py-1 min-w-max">
          <span class="material-symbols-outlined text-outline mr-2 text-[18px]">travel_explore</span>
          <span class="font-label-caps text-label-caps text-on-surface mr-2 font-bold text-xs">ภูมิภาค:</span>
          <select v-model="filters.region" @change="onRegionChange" class="bg-transparent border-none font-body-md text-xs text-primary focus:ring-0 py-1 pl-0 pr-6 cursor-pointer">
            <option value="">ทุกภูมิภาค</option>
            <option value="north">ภาคเหนือ</option>
            <option value="northeast">ภาคตะวันออกเฉียงเหนือ (อีสาน)</option>
            <option value="central">ภาคกลาง</option>
            <option value="east">ภาคตะวันออก</option>
            <option value="west">ภาคตะวันตก</option>
            <option value="south">ภาคใต้</option>
          </select>
        </div>

        <button @click="resetFilters" class="bg-surface-container-lowest shadow-sm rounded-lg border border-outline-variant px-sm py-1 text-primary hover:bg-surface-container-low transition-colors font-bold text-xs whitespace-nowrap">
          ล้างตัวกรอง
        </button>
      </div>

      <!-- 2. MAP VISUALIZATION LAYER (Leaflet.js GIS) - Rendered ClientOnly to avoid SSR errors -->
      <div class="absolute inset-0 z-0">
        <ClientOnly>
          <LeafletMap
            :hotspots="filteredHotspots"
            :fullCanvas="true"
            :activeRegion="filters.region"
            @select-city="handleSelectCity" />
        </ClientOnly>
      </div>

      <!-- 3. OVERLAY PANEL (City Detail - Active when a marker is clicked or defaults to Chiang Mai) -->
      <div v-if="selectedCity" class="absolute right-md top-4 bottom-md w-80 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant flex flex-col z-20 overflow-hidden animate-slide-in">
        <!-- Header -->
        <div class="p-md border-b border-outline-variant flex justify-between items-start" 
             :class="selectedCity.severity === 'high' ? 'bg-error-container text-on-error-container' : selectedCity.severity === 'medium' ? 'bg-tertiary-fixed-dim/30 text-on-tertiary-fixed-variant' : 'bg-secondary-container/30 text-on-secondary-fixed-variant'">
          <div>
            <div class="flex items-center gap-1.5 mb-1 text-[10px] font-bold">
              <span class="w-2.5 h-2.5 rounded-full" 
                    :class="selectedCity.severity === 'high' ? 'bg-error' : selectedCity.severity === 'medium' ? 'bg-tertiary-fixed-dim' : 'bg-secondary'"></span>
              <span class="uppercase tracking-wider">
                {{ selectedCity.severity === 'high' ? 'แจ้งเตือนระดับสูง' : selectedCity.severity === 'medium' ? 'ระดับเฝ้าระวัง' : 'ระดับปกติ' }}
              </span>
            </div>
            <h2 class="font-headline-sm text-base font-bold text-on-surface">{{ selectedCity.city === 'Chiang Mai' ? 'เชียงใหม่' : selectedCity.city === 'Phuket' ? 'ภูเก็ต' : selectedCity.city === 'Bangkok' ? 'กรุงเทพฯ' : selectedCity.city === 'Khon Kaen' ? 'ขอนแก่น' : 'ชลบุรี' }}</h2>
            <p class="text-[10px] opacity-75 mt-0.5">{{ selectedCity.city === 'Chiang Mai' ? 'ศูนย์ภาคเหนือ' : selectedCity.city === 'Phuket' ? 'ศูนย์ภาคใต้' : 'ศูนย์ภาคกลาง' }}</p>
          </div>
          <button class="opacity-70 hover:opacity-100 font-bold text-lg text-on-surface" @click="selectedCity = null">×</button>
        </div>

        <div class="p-md flex-1 overflow-y-auto scroll-hidden flex flex-col gap-lg">
          <!-- Key Metric -->
          <div>
            <span class="font-label-caps text-[10px] text-on-surface-variant font-bold uppercase">เคสที่ยืนยันแล้ว (7 วัน)</span>
            <div class="flex items-end gap-2 mt-1">
              <span class="font-display-lg text-3xl font-extrabold text-on-surface">{{ selectedCity.totalCases }}</span>
              <span class="font-data-mono text-[10px] text-error flex items-center mb-1 bg-error-container/40 px-1.5 py-0.5 rounded font-bold font-bold-500">
                <span class="material-symbols-outlined text-[13px] mr-0.5">trending_up</span> +14.2%
              </span>
            </div>
          </div>

          <!-- Symptoms List (Bento-ish internal layout) -->
          <div>
            <span class="font-label-caps text-[10px] text-on-surface-variant block mb-sm font-bold uppercase">อาการที่พบมากที่สุด</span>
            <div class="grid grid-cols-2 gap-sm">
              <div v-for="(symDetail, index) in getCitySymptomsDetails(selectedCity)" :key="index"
                   :class="symDetail.isSecondary ? 'bg-surface-container-low p-sm rounded-lg border border-outline-variant/50 col-span-2 flex justify-between items-center' : 'bg-surface-container-low p-sm rounded-lg border border-outline-variant/50'">
                
                <template v-if="!symDetail.isSecondary">
                  <span class="block font-body-md text-xs text-on-surface mb-1 font-bold">{{ symDetail.name }}</span>
                  <div class="w-full bg-surface-variant rounded-full h-1.5 mb-1">
                    <div class="h-1.5 rounded-full" :class="symDetail.colorClass" :style="{ width: symDetail.percent + '%' }"></div>
                  </div>
                  <span class="font-data-mono text-[10px] text-on-surface-variant font-bold">{{ symDetail.desc }}</span>
                </template>
                
                <template v-else>
                  <div>
                    <span class="block font-body-md text-xs text-on-surface font-bold">{{ symDetail.name }}</span>
                    <span class="font-data-mono text-[10px] text-on-surface-variant font-bold">{{ symDetail.desc }}</span>
                  </div>
                  <span class="font-headline-sm text-body-lg text-on-surface font-extrabold">{{ symDetail.percent }}%</span>
                </template>
              </div>
            </div>
          </div>

          <!-- Growth sparkline -->
          <div>
            <span class="font-label-caps text-[10px] text-on-surface-variant block mb-sm font-bold uppercase">แนวโน้ม 7 วัน</span>
            <!-- Dynamically style based on selected city severity -->
            <div class="h-16 w-full bg-surface-container-low rounded border border-outline-variant/50 flex items-end p-1.5 gap-1">
              <!-- Chiang Mai / High (Red alert growth) -->
              <template v-if="selectedCity.severity === 'high'">
                <div class="w-full bg-primary/20 h-[20%] rounded-t-sm animate-pulse"></div>
                <div class="w-full bg-primary/30 h-[35%] rounded-t-sm animate-pulse" style="animation-delay: 0.1s"></div>
                <div class="w-full bg-primary/40 h-[40%] rounded-t-sm animate-pulse" style="animation-delay: 0.2s"></div>
                <div class="w-full bg-primary/50 h-[55%] rounded-t-sm animate-pulse" style="animation-delay: 0.3s"></div>
                <div class="w-full bg-error/60 h-[70%] rounded-t-sm animate-pulse" style="animation-delay: 0.4s"></div>
                <div class="w-full bg-error/80 h-[85%] rounded-t-sm animate-pulse" style="animation-delay: 0.5s"></div>
                <div class="w-full bg-error h-[100%] rounded-t-sm animate-pulse" style="animation-delay: 0.6s"></div>
              </template>
              
              <!-- Medium severity (Yellow alert growth) -->
              <template v-else-if="selectedCity.severity === 'medium'">
                <div class="w-full bg-primary/20 h-[15%] rounded-t-sm"></div>
                <div class="w-full bg-primary/35 h-[25%] rounded-t-sm"></div>
                <div class="w-full bg-primary/40 h-[45%] rounded-t-sm"></div>
                <div class="w-full bg-primary/50 h-[35%] rounded-t-sm"></div>
                <div class="w-full bg-tertiary-fixed-dim/60 h-[50%] rounded-t-sm"></div>
                <div class="w-full bg-tertiary-fixed-dim/80 h-[65%] rounded-t-sm"></div>
                <div class="w-full bg-tertiary-fixed-dim h-[75%] rounded-t-sm"></div>
              </template>
              
              <!-- Low/Normal severity (Green growth) -->
              <template v-else>
                <div class="w-full bg-primary/20 h-[10%] rounded-t-sm"></div>
                <div class="w-full bg-primary/30 h-[20%] rounded-t-sm"></div>
                <div class="w-full bg-primary/40 h-[30%] rounded-t-sm"></div>
                <div class="w-full bg-primary/45 h-[40%] rounded-t-sm"></div>
                <div class="w-full bg-secondary-fixed-dim/60 h-[35%] rounded-t-sm"></div>
                <div class="w-full bg-secondary-fixed-dim/80 h-[45%] rounded-t-sm"></div>
                <div class="w-full bg-secondary-fixed-dim h-[50%] rounded-t-sm"></div>
              </template>
            </div>
          </div>
        </div>

        <div class="p-md border-t border-outline-variant bg-surface-container-lowest">
          <button @click="investigateCity(selectedCity.city)" class="w-full border border-primary text-primary py-sm rounded-lg font-label-caps text-label-caps hover:bg-primary-container/10 transition-colors">
            ดูชุดข้อมูลทั้งหมด
          </button>
        </div>
      </div>

      <!-- 4. LIVE FEED FLOATING PANEL (Bottom Left) -->
      <div class="absolute bottom-md left-md w-72 md:w-96 bg-surface-container-lowest/95 backdrop-blur-md rounded-xl shadow-md border border-outline-variant flex flex-col z-20">
        <div class="p-sm border-b border-outline-variant flex items-center justify-between bg-surface-container-low rounded-t-xl text-xs font-bold">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[16px] text-on-surface-variant">rss_feed</span>
            <span class="font-label-caps text-label-caps text-on-surface">ข้อมูลนำเข้าแบบสด</span>
          </div>
          <span class="w-2 h-2 bg-secondary rounded-full animate-pulse"></span>
        </div>
        <div class="p-sm flex flex-col gap-2 max-h-32 overflow-y-auto scroll-hidden text-xs">
          <!-- Dynamic Alert from simulation toast -->
          <div v-if="liveAlertText" class="flex items-start gap-2 text-xs text-secondary font-bold">
            <span class="material-symbols-outlined text-[16px] mt-0.5 animate-bounce">add_circle</span>
            <div>
              <p class="leading-snug">{{ liveAlertText }}</p>
              <span class="text-[9px] text-outline">สดเมื่อกี้นี้ • คลินิกเครือข่าย</span>
            </div>
          </div>

          <!-- Feed Item 2 -->
          <div class="flex items-start gap-2 text-xs border-t border-outline-variant/30 pt-2">
            <span class="material-symbols-outlined text-error text-[16px] mt-0.5">add_circle</span>
            <div>
              <p class="font-body-md text-[13px] text-on-surface leading-snug">พบเคสไข้เลือดออกยืนยันใหม่ใน อ.แม่ริม</p>
              <span class="font-data-mono text-[10px] text-on-surface-variant">2 นาทีที่แล้ว • คลินิก 4B</span>
            </div>
          </div>

          <!-- Feed Item 3 -->
          <div class="flex items-start gap-2 text-xs opacity-70 border-t border-outline-variant/30 pt-2">
            <span class="material-symbols-outlined text-tertiary-fixed-dim text-[16px] mt-0.5">warning</span>
            <div>
              <p class="font-body-md text-[13px] text-on-surface leading-snug">สงสัยกลุ่มก้อนการระบาดในเขตสีลม</p>
              <span class="font-data-mono text-[10px] text-on-surface-variant">14 นาทีที่แล้ว • ระบบอัตโนมัติ</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. Legend Overlay -->
      <div class="absolute bottom-md right-md lg:right-[350px] bg-surface-container-lowest rounded-lg shadow-sm border border-outline-variant p-sm z-20 flex gap-md">
        <div class="flex items-center gap-1">
          <span class="w-3 h-3 rounded-full bg-error"></span>
          <span class="font-data-mono text-[11px] text-on-surface-variant font-bold">ปริมาณสูง</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="w-3 h-3 rounded-full bg-tertiary-fixed-dim"></span>
          <span class="font-data-mono text-[11px] text-on-surface-variant font-bold">เฝ้าระวัง</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="w-3 h-3 rounded-full bg-secondary-fixed-dim"></span>
          <span class="font-data-mono text-[11px] text-on-surface-variant font-bold">ระดับปกติ</span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useState } from '#app';
import LeafletMap from '~/components/LeafletMap.vue';

const router = useRouter();

// API database states
const hotspots = ref([]);
const selectedCity = ref(null);
const liveAlertText = ref('');
const searchQuery = ref('');

// Global real-time states
const activePingCity = useState('active-ping-city');

// Local filters states
const filters = reactive({
  symptom: '',
  duration: '7',
  region: ''
});

// แมปเมือง → ภาค (ใช้ร่วมกับ regionConfig ใน LeafletMap)
const cityToRegion = {
  'Chiang Mai': 'north',
  'Khon Kaen':  'northeast',
  'Bangkok':    'central',
  'Chon Buri':  'east',
  'Phuket':     'south'
};

// เมื่อเปลี่ยนภาค: applyFilters + overlay จะ trigger ผ่าน LeafletMap prop
function onRegionChange() {
  applyFilters();
}

// Load stats from endpoint
async function fetchMapData() {
  try {
    const data = await $fetch('/api/stats');
    if (data.success) {
      hotspots.value = data.hotspots;
      
      // Default select Chiang Mai on load to match mockup layout
      if (!selectedCity.value) {
        const chiangMai = data.hotspots.find(h => h.city === 'Chiang Mai');
        if (chiangMai) {
          selectedCity.value = chiangMai;
        }
      } else {
        // Keep selected city synced if visible
        const matched = data.hotspots.find(h => h.city === selectedCity.value.city);
        if (matched) selectedCity.value = matched;
      }
    }
  } catch (err) {
    console.error('Failed to load map statistics:', err);
  }
}

// Compute filters on client side to simulate dynamic updates
const filteredHotspots = computed(() => {
  if (!hotspots.value.length) return [];
  
  let result = hotspots.value;
  
  // Filter by search query if set
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    result = result.filter(h => h.city.toLowerCase().includes(q));
  }
  


  return result.map(city => {
    let casesModifier = 1.0;
    
    // Simulate cases changes based on filters selected
    if (filters.symptom) {
      casesModifier = filters.symptom === 'Flu symptoms' && city.city === 'Chiang Mai' ? 0.75 : 0.25;
    }
    
    if (filters.duration === '30') {
      casesModifier *= 0.35;
    } else if (filters.duration === '7') {
      casesModifier *= 0.08;
    } else if (filters.duration === '1') {
      casesModifier *= 0.02;
    }

    const calculatedCases = Math.max(Math.round(city.totalCases * casesModifier), 1);
    
    let severity = 'low';
    if (calculatedCases > 35) {
      severity = 'high';
    } else if (calculatedCases > 12) {
      severity = 'medium';
    }

    return {
      ...city,
      totalCases: calculatedCases,
      severity
    };
  });
});

// Calculate symptom presentation distributions for selected city details card
function getCitySymptomsDetails(city) {
  if (!city) return [];
  
  if (city.city === 'Chiang Mai') {
    return [
      { name: 'ไข้สูง', percent: 85, colorClass: 'bg-error', desc: '85% presentation' },
      { name: 'ปวดกล้ามเนื้อ', percent: 62, colorClass: 'bg-tertiary-fixed-dim', desc: '62% presentation' },
      { name: 'ผื่น / จุดเลือดออก', percent: 41, isSecondary: true, desc: 'ตัวบ่งชี้รอง' }
    ];
  }
  if (city.city === 'Phuket') {
    return [
      { name: 'ท้องเสีย/อาเจียน', percent: 72, colorClass: 'bg-error', desc: '72% presentation' },
      { name: 'ไข้หวัดล้า', percent: 54, colorClass: 'bg-tertiary-fixed-dim', desc: '54% presentation' },
      { name: 'ภาวะขาดน้ำ', percent: 30, isSecondary: true, desc: 'ตัวบ่งชี้รอง' }
    ];
  }
  
  // Default (Bangkok, etc.)
  return [
    { name: 'ไข้ตัวร้อน', percent: 58, colorClass: 'bg-error', desc: '58% presentation' },
    { name: 'มีผื่นคัน', percent: 45, colorClass: 'bg-tertiary-fixed-dim', desc: '45% presentation' },
    { name: 'ปวดศีรษะ', percent: 32, isSecondary: true, desc: 'ตัวบ่งชี้รอง' }
  ];
}

function handleSelectCity(cityData) {
  // Find filtered values to show correct metrics in card
  const filtered = filteredHotspots.value.find(h => h.city === cityData.city);
  selectedCity.value = filtered || cityData;
}

function investigateCity(cityName) {
  router.push({
    path: '/explorer',
    query: { city: cityName }
  });
}

function handleSearchSearch() {
  if (searchQuery.value.trim()) {
    const matched = filteredHotspots.value.find(
      h => h.city.toLowerCase().includes(searchQuery.value.toLowerCase().trim())
    );
    if (matched) {
      selectedCity.value = matched;
    }
  }
}

// Apply reactive filters changes
function applyFilters() {
  if (selectedCity.value) {
    const updated = filteredHotspots.value.find(h => h.city === selectedCity.value.city);
    selectedCity.value = updated || null;
  }
}

function resetFilters() {
  filters.symptom = '';
  filters.duration = '7';
  filters.region = '';   // ล้างภาค → LeafletMap จะลบ overlay + zoom กลับ
  searchQuery.value = '';
  applyFilters();
}

// Watch global case pings to update feed panel
watch(activePingCity, (newCity) => {
  if (newCity) {
    liveAlertText.value = `พบเคสใหม่: ติดเชื้อพิกัดเขต ${newCity}`;
    fetchMapData();
    
    // Clear feed alerts
    setTimeout(() => {
      liveAlertText.value = '';
    }, 8000);
  }
});

onMounted(() => {
  fetchMapData();
});
</script>

<style scoped>
.animate-slide-in {
  animation: slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.1) forwards;
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.scroll-hidden::-webkit-scrollbar {
  display: none;
}
.scroll-hidden {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
