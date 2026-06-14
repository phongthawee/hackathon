<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import LeafletMap from '~/components/LeafletMap.vue'

const router = useRouter()

interface PatientRecord {
  patientName: string
  symptom: string
  disease: string
  date: string
}

interface OutbreakHotspot {
  hospitalName: string
  address: string
  lat: number
  lng: number
  totalCases: number
  symptoms: Record<string, number>
  geminiAnalyses: Record<string, number>
  patients: PatientRecord[]
}

const hotspots = ref<OutbreakHotspot[]>([])
const topRisk = ref<OutbreakHotspot | null>(null)
const selectedHospital = ref<OutbreakHotspot | null>(null)
const totalConfirmed = ref(0)
const loading = ref(false)
const errorMsg = ref('')

async function loadOutbreakData() {
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await $fetch<{
      success: boolean
      hotspots: OutbreakHotspot[]
      topRiskLocation: OutbreakHotspot | null
      totalConfirmedCases: number
      error?: string
    }>('/api/outbreaks')
    
    if (data.success) {
      hotspots.value = data.hotspots
      topRisk.value = data.topRiskLocation
      totalConfirmed.value = data.totalConfirmedCases
      // Default to selected top risk location
      if (data.topRiskLocation) {
        selectedHospital.value = data.topRiskLocation
      }
    } else {
      errorMsg.value = data.error || 'ดึงข้อมูลพิกัดความเสี่ยงไม่สำเร็จ'
    }
  } catch (err: any) {
    errorMsg.value = err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลพิกัดความเสี่ยง'
  } finally {
    loading.value = false
  }
}

// แปลงข้อมูลจาก API เป็นรูปแบบที่ Component LeafletMap ต้องการ
const leafletHotspots = computed(() => {
  return hotspots.value.map(spot => {
    // หาโรคที่วินิจฉัยบ่อยที่สุด
    const topDiagnoses = Object.entries(spot.geminiAnalyses)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([disease, count]) => `${disease} (${count} เคส)`)
      
    // กำหนดระดับความรุนแรงตามจำนวนคนไข้
    let severity: 'high' | 'medium' | 'low' = 'low'
    if (spot.totalCases >= 4) {
      severity = 'high'
    } else if (spot.totalCases >= 1) {
      severity = 'medium'
    }
    
    // คาดเดาจังหวัดจากที่อยู่หรือชื่อโรงพยาบาลเพื่อความสมบูรณ์
    let city = 'Bangkok'
    const addr = spot.address.toLowerCase()
    if (addr.includes('chiang mai') || addr.includes('เชียงใหม่')) city = 'Chiang Mai'
    else if (addr.includes('phuket') || addr.includes('ภูเก็ต')) city = 'Phuket'
    else if (addr.includes('khon kaen') || addr.includes('ขอนแก่น')) city = 'Khon Kaen'
    else if (addr.includes('chon buri') || addr.includes('ชลบุรี')) city = 'Chon Buri'
    
    return {
      city,
      hospitalName: spot.hospitalName,
      hospital: spot.hospitalName,
      lat: spot.lat,
      lng: spot.lng,
      totalCases: spot.totalCases,
      severity,
      topSymptoms: topDiagnoses.length ? topDiagnoses : ['ยังไม่มีสถิติโรควิเคราะห์']
    }
  })
})

function onSelectHospital(leafletSpot: any) {
  const matched = hotspots.value.find(h => h.hospitalName === leafletSpot.hospitalName)
  if (matched) {
    selectedHospital.value = matched
  }
}

// คาดการณ์สิทธิ์การแนะนำระบาดวิทยาจากโรคที่เสี่ยงสุด
const diseaseRecommendation = computed(() => {
  if (!selectedHospital.value) return ''
  
  // หาโรคที่มีผู้ป่วยสูงที่สุดในโรงพยาบาลนี้
  const sorted = Object.entries(selectedHospital.value.geminiAnalyses)
    .sort((a, b) => b[1] - a[1])
  
  const topDiseaseEntry = sorted[0]
  if (!topDiseaseEntry) return 'ยังไม่มีข้อมูลการวินิจฉัยโรคเพื่อสร้างคำแนะนำ'
  
  const topDisease = topDiseaseEntry[0]
  const count = topDiseaseEntry[1]
  
  let advice = `ตรวจพบผู้ป่วยโรค "${topDisease}" สะสมสูงสุดในสถานพยาบาลแห่งนี้จำนวน ${count} เคส. `
  
  if (topDisease.includes('ไข้หวัดใหญ่') || topDisease.includes('Influenza')) {
    advice += 'แนะนำให้จัดเตรียมวัคซีนป้องกันไข้หวัดใหญ่ และรณรงค์ให้ผู้ที่มีอาการของระบบทางเดินหายใจสวมหน้ากากอนามัยในพื้นที่แออัดเพื่อความปลอดภัย'
  } else if (topDisease.includes('ไข้เลือดออก') || topDisease.includes('Dengue')) {
    advice += 'แนะนำให้ส่งทีม อสม. ลงพื้นที่กำจัดแหล่งน้ำขังที่เป็นแหล่งเพาะพันธุ์ยุงลายตัวนำโรคทันทีเพื่อสกัดกั้นคลัสเตอร์ระบาด'
  } else if (topDisease.includes('อาหารเป็นพิษ') || topDisease.includes('Food Poisoning') || topDisease.includes('ท้องเสีย') || topDisease.includes('ท้องร่วง')) {
    advice += 'แนะนำให้เร่งตรวจสอบมาตรฐานสุขาภิบาลร้านอาหารและโรงอาหารหลักในพื้นที่ รวมถึงแจกจ่ายสารเกลือแร่ฉุกเฉิน (ORS)'
  } else if (topDisease.includes('โควิด') || topDisease.includes('COVID')) {
    advice += 'แนะนำให้เปิดจุดคัดกรองเบื้องต้น จัดเตรียมชุดตรวจ ATK และควบคุมการระบายอากาศของสถานพยาบาลให้มีความปลอดภัย'
  } else {
    advice += 'แนะนำให้จัดส่งข้อมูลเฝ้าระวังนี้ไปยังศูนย์ควบคุมโรคระบาดท้องถิ่น ติดตามประวัติการเดินทางของผู้ป่วย และเตรียมเวชภัณฑ์ยารักษาตามอาการให้เพียงพอ'
  }
  
  return advice
})

onMounted(() => {
  loadOutbreakData()
})
</script>

<template>
  <div class="flex-grow flex flex-col relative w-full h-full overflow-hidden bg-slate-950 text-slate-100 font-['Inter'] antialiased">
    <!-- Top Nav Bar -->
    <header class="bg-slate-900 border-b border-slate-800 flex justify-between items-center w-full px-6 py-4 sticky top-0 z-30 shadow-md">
      <div class="flex items-center gap-3">
        <h1 class="font-bold text-xl font-['Outfit'] tracking-wide text-white flex items-center gap-2">
          <span class="material-symbols-outlined text-indigo-400">spatial_tracking</span>
          AI Outbreak Risk Mapping
        </h1>
        <span class="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span> Live view Analysis
        </span>
      </div>

      <!-- Quick Metrics -->
      <div class="hidden md:flex items-center gap-6 text-xs text-slate-400">
        <div>
          <span class="block text-[9px] uppercase font-bold text-slate-500 tracking-wider">เคสยืนยันทั้งหมด (Confirmed)</span>
          <span class="text-sm font-bold text-white font-mono">{{ totalConfirmed }} เคส</span>
        </div>
        <div class="h-6 w-px bg-slate-800"></div>
        <div v-if="topRisk">
          <span class="block text-[9px] uppercase font-bold text-slate-500 tracking-wider">พื้นที่เสี่ยงสูงสุด (Top Danger)</span>
          <span class="text-sm font-bold text-red-400 flex items-center gap-1">
            <span class="material-symbols-outlined text-xs">warning</span>
            {{ topRisk.hospitalName }} ({{ topRisk.totalCases }} เคส)
          </span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button 
          @click="loadOutbreakData" 
          class="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 rounded-xl border border-slate-700 transition-colors"
          title="โหลดข้อมูลใหม่"
        >
          <span class="material-symbols-outlined text-lg" :class="{ 'animate-spin': loading }">refresh</span>
        </button>
        <NuxtLink 
          to="/diagnose" 
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/25 transition-all flex items-center gap-1.5"
        >
          <span class="material-symbols-outlined text-base">clinical_aesthetics</span>
          วิเคราะห์โรคผู้ป่วย
        </NuxtLink>
      </div>
    </header>

    <!-- Main Map Workspace -->
    <div class="flex-1 relative overflow-hidden bg-slate-950">
      
      <!-- Leaflet Map Container -->
      <div class="absolute inset-0 z-0">
        <ClientOnly>
          <LeafletMap :hotspots="leafletHotspots" :fullCanvas="true" @select-city="onSelectHospital" />
          <template #fallback>
            <div class="w-full h-full flex flex-col items-center justify-center bg-slate-950">
              <div class="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p class="text-slate-400 text-sm">กำลังโหลดแผนที่ GIS...</p>
            </div>
          </template>
        </ClientOnly>
      </div>

      <!-- FLOATING PANEL LEFT: Top Danger Location Card -->
      <div v-if="topRisk" class="absolute left-6 top-6 w-80 bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-800/80 p-5 z-20 animate-slide-in pointer-events-auto">
        <div class="flex items-center gap-1.5 mb-3">
          <span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
          <span class="font-bold text-[9px] uppercase tracking-wider text-red-400">พื้นที่เสี่ยงสะสมสูงสุด (Top Danger Hub)</span>
        </div>
        
        <h3 class="font-extrabold text-white text-base font-['Outfit'] mb-1">{{ topRisk.hospitalName }}</h3>
        <p class="text-[10px] text-slate-400 leading-normal flex items-start gap-1 mb-4">
          <span class="material-symbols-outlined text-[13px] text-indigo-400 shrink-0">location_on</span>
          {{ topRisk.address }}
        </p>

        <div class="grid grid-cols-2 gap-3 mb-4">
          <div class="bg-slate-950/60 rounded-xl p-3 border border-slate-800/50">
            <span class="text-[9px] font-bold text-slate-500 block uppercase mb-0.5">พิกัดแผนที่</span>
            <span class="text-xs font-mono text-slate-300 font-bold">
              {{ topRisk.lat.toFixed(4) }}, {{ topRisk.lng.toFixed(4) }}
            </span>
          </div>
          <div class="bg-red-950/25 rounded-xl p-3 border border-red-500/10">
            <span class="text-[9px] font-bold text-red-500/70 block uppercase mb-0.5">เคสสะสมทั้งหมด</span>
            <span class="text-sm font-bold text-red-400 font-mono flex items-baseline gap-1">
              {{ topRisk.totalCases }} <span class="text-[10px] font-normal text-slate-400">เคส</span>
            </span>
          </div>
        </div>

        <!-- AI Predicted Diseases breakdown -->
        <div>
          <span class="text-[10px] font-bold text-slate-400 block uppercase mb-2">สถิติโรคจากการวิเคราะห์ของ AI</span>
          <div class="space-y-2 max-h-[140px] overflow-y-auto pr-1">
            <div 
              v-for="([disease, count]) in Object.entries(topRisk.geminiAnalyses).sort((a,b)=>b[1]-a[1])"
              :key="disease"
              class="text-xs"
            >
              <div class="flex justify-between text-[11px] font-medium text-slate-300 mb-0.5">
                <span>{{ disease }}</span>
                <span class="font-bold text-indigo-400 font-mono">{{ count }} ราย</span>
              </div>
              <div class="w-full bg-slate-950 rounded-full h-1.5 border border-slate-800/50">
                <div 
                  class="bg-indigo-500 h-1.5 rounded-full" 
                  :style="{ width: `${(count / topRisk.totalCases) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- FLOATING PANEL RIGHT: Detailed patients and recommendation panel -->
      <div v-if="selectedHospital" class="absolute right-6 top-6 bottom-6 w-96 bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-800/80 flex flex-col z-20 animate-slide-in-right overflow-hidden pointer-events-auto">
        <!-- Panel Header -->
        <div class="p-5 border-b border-slate-800/80 bg-slate-900/40">
          <div class="flex justify-between items-start mb-2">
            <div class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full" 
                    :class="selectedHospital.totalCases >= 4 ? 'bg-red-500' : selectedHospital.totalCases >= 1 ? 'bg-yellow-500' : 'bg-emerald-500'"></span>
              <span class="font-bold text-[9px] uppercase tracking-wider text-slate-400">ข้อมูลรายละเอียดพิกัด</span>
            </div>
            <button class="text-slate-400 hover:text-white font-extrabold text-base" @click="selectedHospital = null">×</button>
          </div>
          <h3 class="font-extrabold text-white text-base font-['Outfit']">{{ selectedHospital.hospitalName }}</h3>
          <p class="text-[10px] text-slate-400 leading-relaxed mt-1 flex items-start gap-1">
            <span class="material-symbols-outlined text-[13px] text-indigo-400 shrink-0">location_on</span>
            {{ selectedHospital.address }}
          </p>
        </div>

        <!-- Panel Body -->
        <div class="p-5 flex-grow overflow-y-auto space-y-5 custom-scrollbar">
          <!-- Stats Summary -->
          <div class="bg-slate-950/80 rounded-xl p-4 border border-slate-800/60">
            <h4 class="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wide">สถิติจำนวนรวมของคนไข้</h4>
            <div class="flex justify-between items-center text-sm font-semibold">
              <span class="text-slate-400">ยอดผู้ป่วยยืนยัน (Confirmed)</span>
              <span class="font-mono text-white text-base font-extrabold">{{ selectedHospital.totalCases }} ราย</span>
            </div>
          </div>

          <!-- AI Advice -->
          <div class="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-4">
            <div class="flex items-start gap-2.5">
              <span class="material-symbols-outlined text-indigo-400 text-lg mt-0.5 animate-pulse">tips_and_updates</span>
              <div>
                <span class="text-[10px] font-bold text-indigo-300 block uppercase tracking-wider mb-1">คำแนะนำระบาดวิทยาเชิงพื้นที่</span>
                <p class="text-xs text-slate-300 leading-relaxed">
                  {{ diseaseRecommendation }}
                </p>
              </div>
            </div>
          </div>

          <!-- Patient list in view -->
          <div>
            <h4 class="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wide flex items-center gap-1.5">
              <span class="material-symbols-outlined text-sm text-indigo-400">group</span>
              รายชื่อคนไข้ (ดึงข้อมูลจาก Database View)
            </h4>
            
            <div v-if="selectedHospital.patients.length === 0" class="text-center text-slate-500 text-xs italic py-6">
              ยังไม่มีคนไข้ที่มีประวัติวินิจฉัยโรคในฐานข้อมูล
            </div>
            
            <div v-else class="space-y-3">
              <div 
                v-for="(pat, idx) in selectedHospital.patients" 
                :key="idx"
                class="bg-slate-950/50 hover:bg-slate-950 rounded-xl p-3 border.5 border-slate-850 hover:border-slate-800 transition-all flex flex-col gap-1.5"
              >
                <div class="flex justify-between items-center">
                  <span class="font-bold text-white text-xs">{{ pat.patientName }}</span>
                  <span class="text-[9px] text-slate-500 font-mono">{{ new Date(pat.date).toLocaleDateString('th-TH') }}</span>
                </div>
                <div class="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                  <div>
                    <span class="block text-[8px] font-bold text-slate-500 uppercase tracking-wider">อาการแรกรับ</span>
                    <span class="font-medium text-slate-300">{{ pat.symptom }}</span>
                  </div>
                  <div>
                    <span class="block text-[8px] font-bold text-slate-500 uppercase tracking-wider">วินิจฉัยจาก AI</span>
                    <span class="font-bold text-emerald-400">{{ pat.disease }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Panel Footer -->
        <div class="p-5 border-t border-slate-800/80 bg-slate-900/40">
          <button 
            @click="router.push({ path: '/explorer', query: { search: selectedHospital.hospitalName } })" 
            class="w-full bg-slate-850 hover:bg-slate-800 text-slate-200 py-2.5 rounded-xl border border-slate-850 hover:border-slate-750 transition-colors font-semibold text-xs flex items-center justify-center gap-1.5"
          >
            <span class="material-symbols-outlined text-sm">database</span>
            เจาะลึกฐานข้อมูลคนไข้เพิ่มเติม
          </button>
        </div>
      </div>

      <!-- LEGEND / INFO BAR (Bottom Right) -->
      <div class="absolute bottom-6 right-6 bg-slate-900/90 backdrop-blur-md rounded-xl shadow-lg border border-slate-800 p-3.5 z-20 flex gap-4 text-xs font-semibold">
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          <span class="text-slate-300">ปริมาณเคสสูง (>= 4 เคส)</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
          <span class="text-slate-300">ปริมาณเคสปานกลาง (>= 1 เคส)</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span class="text-slate-300">ไม่มีเคสผู้ป่วย</span>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.animate-slide-in {
  animation: slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.1) forwards;
}

.animate-slide-in-right {
  animation: slideInRight 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.1) forwards;
}

@keyframes slideIn {
  from { transform: translateX(-20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes slideInRight {
  from { transform: translateX(20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* Custom Scrollbar for list items */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 2px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #475569;
}
</style>
