  //pages/diagnose
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const { fetchAppointments } = useAppointments()

interface Appointment {
  apt_id: string
  user_id: string
  doctor_id: string
  symptom: string
}

const appointments = ref<Appointment[]>([])
const loadingAppointments = ref(false)
const errorMsg = ref('')

// ตัวแปรสำหรับเก็บผลลัพธ์การวินิจฉัย (diagnosisResults)
// โครงสร้างคือ { [apt_id]: "ชื่อโรคที่วิเคราะห์ได้" }
const diagnosisResults = ref<Record<string, string>>({})
const loadingDiagnose = ref<Record<string, boolean>>({})

// ตัวแปรเก็บข้อมูลคนป่วยที่ได้รับการวิเคราะห์แล้วเพื่อนำไปใช้ต่อได้ (ตามคำขอของผู้ใช้)
interface DiagnosedPatient extends Appointment {
  predictedDisease: string
}
const diagnosedPatientsList = ref<DiagnosedPatient[]>([])

// สร้างแถบล็อกจำลองในหน้าจอควบคู่กับ console.log เพื่อเพิ่มความพรีเมียม
const terminalLogs = ref<{ time: string; type: 'info' | 'success' | 'error' | 'system'; text: string }[]>([])

function logMessage(text: string, type: 'info' | 'success' | 'error' | 'system' = 'info') {
  const time = new Date().toLocaleTimeString()
  terminalLogs.value.unshift({ time, type, text })
  
  // พ่นออกเบราว์เซอร์ Console ตามความต้องการของนักพัฒนา
  if (type === 'success') {
    console.log(`%c[Gemini AI Success ${time}] ${text}`, 'color: #10B981; font-weight: bold; font-size: 13px;')
  } else if (type === 'error') {
    console.error(`[Gemini AI Error ${time}] ${text}`)
  } else if (type === 'system') {
    console.log(`%c[System ${time}] ${text}`, 'color: #8B5CF6; font-weight: bold;')
  } else {
    console.log(`[Gemini AI Info ${time}] ${text}`)
  }
}

async function loadData() {
  loadingAppointments.value = true
  errorMsg.value = ''
  logMessage('กำลังเริ่มดึงข้อมูลรายชื่อผู้ป่วย...', 'system')
  try {
    const data = await fetchAppointments()
    appointments.value = data as Appointment[]
    logMessage(`ดึงข้อมูลรายชื่อผู้ป่วยสำเร็จ: พบทั้งหมด ${appointments.value.length} รายที่มีสถานะ CONFIRMED`, 'success')
  } catch (err: any) {
    errorMsg.value = 'ไม่สามารถดึงข้อมูลนัดหมายผู้ป่วยได้'
    logMessage(`เกิดข้อผิดพลาดในการโหลดข้อมูล: ${err.message}`, 'error')
  } finally {
    loadingAppointments.value = false
  }
}

async function diagnosePatient(aptId: string, symptom: string) {
  if (loadingDiagnose.value[aptId]) return
  
  loadingDiagnose.value[aptId] = true
  logMessage(`[apt_id: ${aptId}] เริ่มส่งข้อมูลอาการไปให้ Gemini: "${symptom}"`, 'info')
  
  try {
    const data = await $fetch<{ success: boolean; disease?: string; error?: string; isMock?: boolean }>('/api/diagnose', {
      method: 'POST',
      body: { symptom }
    })
    
    if (data.success && data.disease) {
      // เก็บค่าผลลัพธ์การวินิจฉัยลงในตัวแปรหลัก (diagnosisResults)
      diagnosisResults.value[aptId] = data.disease
      
      // เก็บรวบรวมข้อมูลคนไข้ที่ได้รับการวินิจฉัยแล้วลงในตัวแปรสำหรับนำไปใช้ต่อ
      const patientData = appointments.value.find(apt => apt.apt_id === aptId)
      if (patientData) {
        const index = diagnosedPatientsList.value.findIndex(p => p.apt_id === aptId)
        const updatedEntry = { ...patientData, predictedDisease: data.disease }
        if (index > -1) {
          diagnosedPatientsList.value[index] = updatedEntry
        } else {
          diagnosedPatientsList.value.push(updatedEntry)
        }
        
        // พิมพ์ log ตัวแปรนั้นออกมาให้ตรวจสอบ
        console.log(`%c[diagnosedPatientsList updated]`, 'color: #06B6D4; font-weight: bold;', JSON.parse(JSON.stringify(diagnosedPatientsList.value)))
      }
      
      const source = data.isMock ? 'Mock API' : 'Gemini 3.5'
      logMessage(`[apt_id: ${aptId}] วิเคราะห์เสร็จสิ้น (${source}) -> โรคที่มีสิทธิ์เป็นมากที่สุด: ${data.disease}`, 'success')
      logMessage(`ตัวแปร diagnosedPatientsList อัปเดตแล้ว (รวมทั้งหมด ${diagnosedPatientsList.value.length} เคส) -> ตรวจดูผลลัพธ์ใน DevTools Console`, 'info')
    } else {
      logMessage(`[apt_id: ${aptId}] วิเคราะห์ล้มเหลว: ${data.error || 'ไม่มีข้อมูลส่งกลับจาก API'}`, 'error')
    }
  } catch (err: any) {
    logMessage(`[apt_id: ${aptId}] เกิดข้อผิดพลาดทางเทคนิค: ${err.message}`, 'error')
  } finally {
    loadingDiagnose.value[aptId] = false
  }
}

async function diagnoseAll() {
  if (appointments.value.length === 0) return
  logMessage('กำลังเริ่มต้นวิเคราะห์โรคของคนไข้ทั้งหมดพร้อมกัน...', 'system')
  const promises = appointments.value.map(apt => diagnosePatient(apt.apt_id, apt.symptom))
  await Promise.all(promises)
  logMessage('วิเคราะห์คนไข้ครบทั้งหมดเป็นที่เรียบร้อย', 'system')
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 font-['Inter'] antialiased selection:bg-indigo-500 selection:text-white pb-16">
    <!-- พื้นหลังแสงเรือง (Glow Effect) เพื่อความล้ำสมัย -->
    <div class="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

    <div class="max-w-7xl mx-auto px-6 pt-10 relative z-10">
      <!-- Header -->
      <header class="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-8 mb-10 gap-6">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-400/10 text-indigo-400 border border-indigo-400/20">
              AI Surveillance Module
            </span>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Gemini Connected
            </span>
          </div>
          <h1 class="text-4xl font-extrabold text-white tracking-tight font-['Outfit'] bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
            AI Patient Diagnosis
          </h1>
          <p class="text-slate-400 mt-2 text-sm md:text-base">
            วิเคราะห์ความเสี่ยงโรคและอาการของผู้ป่วยที่มีสถานะการนัดหมายสมบูรณ์ (Confirmed Cases) ด้วยปัญญาประดิษฐ์
          </p>
        </div>
        <div class="flex items-center gap-3">
          <NuxtLink 
            to="/" 
            class="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex items-center gap-2"
          >
            <span class="material-symbols-outlined text-lg">arrow_back</span>
            กลับสู่หน้าหลัก
          </NuxtLink>
          <button 
            @click="loadData"
            class="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors"
            title="โหลดข้อมูลใหม่"
            :disabled="loadingAppointments"
          >
            <span class="material-symbols-outlined text-lg" :class="{ 'animate-spin': loadingAppointments }">refresh</span>
          </button>
          <button
            v-if="appointments.length > 0"
            @click="diagnoseAll"
            class="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <span class="material-symbols-outlined text-lg">clinical_aesthetics</span>
            วิเคราะห์โรคทั้งหมด
          </button>
        </div>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- ฝั่งซ้าย/กลาง: แสดงรายชื่อผู้ป่วยและการวินิจฉัย -->
        <div class="lg:col-span-2 space-y-6">
          <h2 class="text-lg font-semibold text-white flex items-center gap-2 font-['Outfit']">
            <span class="material-symbols-outlined text-indigo-400">patient_list</span>
            รายชื่อผู้ป่วยที่รอยืนยันโรค (Confirmed Appointments)
          </h2>

          <!-- สถานะกำลังโหลดผู้ป่วย -->
          <div v-if="loadingAppointments" class="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-12 text-center">
            <div class="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p class="text-slate-400">กำลังดึงข้อมูลผู้ป่วยจากฐานข้อมูล...</p>
          </div>

          <!-- กรณีเกิดข้อผิดพลาดในการโหลดข้อมูล -->
          <div v-else-if="errorMsg" class="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
            <span class="material-symbols-outlined text-red-400 text-4xl mb-2">warning</span>
            <p class="text-red-300 font-medium">{{ errorMsg }}</p>
            <button @click="loadData" class="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 text-sm font-semibold rounded-lg transition-colors">
              ลองใหม่อีกครั้ง
            </button>
          </div>

          <!-- กรณีไม่มีข้อมูลคนไข้Confirmed -->
          <div v-else-if="appointments.length === 0" class="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-12 text-center">
            <span class="material-symbols-outlined text-slate-500 text-4xl mb-2">assignment_ind</span>
            <p class="text-slate-400">ไม่พบรายชื่อผู้ป่วยที่มีสถานะ CONFIRMED ในระบบขณะนี้</p>
          </div>

          <!-- รายชื่อการ์ดผู้ป่วย -->
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div 
              v-for="apt in appointments" 
              :key="apt.apt_id"
              class="bg-slate-900/70 backdrop-blur-md border border-slate-800/80 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/5 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <!-- ข้อมูลบัตรผู้ป่วย -->
                <div class="flex justify-between items-start mb-4">
                  <div class="flex items-center gap-2.5">
                    <div class="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 font-bold text-sm">
                      P
                    </div>
                    <div>
                      <h4 class="font-bold text-white text-sm">ผู้ป่วย: {{ apt.user_id }}</h4>
                      <p class="text-xs text-slate-500">นัดหมาย: {{ apt.apt_id }}</p>
                    </div>
                  </div>
                  <span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Confirmed
                  </span>
                </div>

                <!-- อาการผู้ป่วย -->
                <div class="bg-slate-950/60 rounded-xl p-4 border border-slate-800/60 mb-5">
                  <span class="text-slate-500 text-[10px] font-bold block uppercase tracking-wider mb-1">
                    อาการแรกรับ (Symptom)
                  </span>
                  <p class="text-sm text-slate-200 font-medium">
                    {{ apt.symptom }}
                  </p>
                </div>
              </div>

              <!-- ผลลัพธ์วิเคราะห์โรค / ปุ่มทำงาน -->
              <div class="border-t border-slate-800/50 pt-4 mt-auto">
                <div v-if="diagnosisResults[apt.apt_id]" class="bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 border border-emerald-500/30 rounded-xl p-3.5 animate-fadeIn">
                  <span class="text-emerald-400 text-[10px] font-extrabold block uppercase tracking-wider mb-0.5 flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm">insights</span>
                    ผลวิเคราะห์ที่มีสิทธิ์เป็นมากที่สุด
                  </span>
                  <p class="text-sm font-bold text-white leading-relaxed">
                    {{ diagnosisResults[apt.apt_id] }}
                  </p>
                </div>
                <div v-else-if="loadingDiagnose[apt.apt_id]" class="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 flex items-center justify-center gap-3">
                  <div class="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                  <span class="text-xs text-indigo-300 font-medium">กำลังส่งวิเคราะห์ด้วย Gemini AI...</span>
                </div>
                <div v-else class="flex items-center justify-between gap-4">
                  <span class="text-xs text-slate-500 flex items-center gap-1">
                    <span class="material-symbols-outlined text-base">hourglass_empty</span>
                    รอดำเนินการ
                  </span>
                  <button 
                    @click="diagnosePatient(apt.apt_id, apt.symptom)"
                    class="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 rounded-lg hover:shadow-md hover:shadow-indigo-600/10 active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <span class="material-symbols-outlined text-sm">clinical_aesthetics</span>
                    วิเคราะห์อาการ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ฝั่งขวา: Real-time Developer Logs / Console Output -->
        <div class="lg:col-span-1 space-y-6">
          <h2 class="text-lg font-semibold text-white flex items-center gap-2 font-['Outfit']">
            <span class="material-symbols-outlined text-indigo-400">terminal</span>
            Console Log Feed
          </h2>

          <div class="bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-inner">
            <div class="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                <span class="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              </div>
              <span class="text-[10px] text-slate-500 font-mono">system_logs.sh</span>
            </div>

            <!-- กล่องล็อกแบบคอมมานด์ไลน์ -->
            <div class="h-[450px] overflow-y-auto font-mono text-[11px] leading-relaxed pr-1 space-y-3 custom-scrollbar">
              <div 
                v-for="(log, idx) in terminalLogs" 
                :key="idx"
                class="border-b border-slate-900/50 pb-2 animate-fadeIn"
              >
                <div class="flex items-center gap-1.5 text-slate-600 mb-0.5">
                  <span>{{ log.time }}</span>
                  <span class="px-1 rounded bg-slate-900 border border-slate-800 font-semibold" :class="{
                    'text-emerald-400 border-emerald-500/20 bg-emerald-500/5': log.type === 'success',
                    'text-red-400 border-red-500/20 bg-red-500/5': log.type === 'error',
                    'text-violet-400 border-violet-500/20 bg-violet-500/5': log.type === 'system',
                    'text-slate-400': log.type === 'info'
                  }">{{ log.type }}</span>
                </div>
                <p class="text-slate-300 break-words font-medium">{{ log.text }}</p>
              </div>
              
              <!-- เริ่มต้นว่างเปล่า -->
              <div v-if="terminalLogs.length === 0" class="text-slate-600 italic py-4 text-center">
                รอดำเนินการวิเคราะห์เพื่อพิมพ์ Logs...
              </div>
            </div>
          </div>
          
          <div class="bg-indigo-950/20 border border-indigo-500/10 rounded-xl p-4">
            <div class="flex gap-2">
              <span class="material-symbols-outlined text-indigo-400 text-lg">info</span>
              <div class="text-[11px] text-slate-400 leading-normal">
                <p class="font-bold text-slate-300 mb-1">คำแนะนำการตรวจสอบ:</p>
                กดปุ่ม <strong>"F12"</strong> บนแป้นพิมพ์เพื่อสลับไปที่เมนู <strong>Console</strong> ของเบราว์เซอร์ เพื่อดูการพิมพ์ค่า (Log) ออกมาในรูปแบบตกแต่งสีสันพิเศษจากระบบ AI อีกช่องทางหนึ่ง
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* คอนโทรลแอนิเมชันสำหรับข้อมูลที่เพิ่งโหลด */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fadeIn {
  animation: fadeIn 0.3s ease forwards;
}

/* Custom Scrollbar for Terminal Logs Box */
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

