<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import LeafletMap from "~/components/LeafletMap.vue";

const router = useRouter();

interface PatientRecord {
  patientName: string;
  symptom: string;
  disease: string;
  date: string;
}

interface OutbreakHotspot {
  hospitalName: string;
  address: string;
  lat: number;
  lng: number;
  totalCases: number;
  symptoms: Record<string, number>;
  geminiAnalyses: Record<string, number>;
  patients: PatientRecord[];
}

const hotspots = ref<OutbreakHotspot[]>([]);
const topRisk = ref<OutbreakHotspot | null>(null);
const selectedHospital = ref<OutbreakHotspot | null>(null);
const totalConfirmed = ref(0);
const loading = ref(false);
const errorMsg = ref("");

async function loadOutbreakData() {
  loading.value = true;
  errorMsg.value = "";
  try {
    const data = await $fetch<{
      success: boolean;
      hotspots: OutbreakHotspot[];
      topRiskLocation: OutbreakHotspot | null;
      totalConfirmedCases: number;
      error?: string;
    }>("/api/outbreaks");

    if (data.success) {
      hotspots.value = data.hotspots;
      topRisk.value = data.topRiskLocation;
      totalConfirmed.value = data.totalConfirmedCases;
      // Default to selected top risk location
      if (data.topRiskLocation) {
        selectedHospital.value = data.topRiskLocation;
      }
    } else {
      errorMsg.value = data.error || "ดึงข้อมูลพิกัดความเสี่ยงไม่สำเร็จ";
    }
  } catch (err: any) {
    errorMsg.value =
      err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูลพิกัดความเสี่ยง";
  } finally {
    loading.value = false;
  }
}

// แปลงข้อมูลจาก API เป็นรูปแบบที่ Component LeafletMap ต้องการ
const leafletHotspots = computed(() => {
  return hotspots.value.map((spot) => {
    // หาโรคที่วินิจฉัยบ่อยที่สุด
    const topDiagnoses = Object.entries(spot.geminiAnalyses)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([disease, count]) => `${disease} (${count} เคส)`);

    // กำหนดระดับความรุนแรงตามจำนวนคนไข้
    let severity: "high" | "medium" | "low" = "low";
    if (spot.totalCases >= 4) {
      severity = "high";
    } else if (spot.totalCases >= 1) {
      severity = "medium";
    }

    // คาดเดาจังหวัดจากที่อยู่หรือชื่อโรงพยาบาลเพื่อความสมบูรณ์
    let city = "Bangkok";
    const addr = spot.address.toLowerCase();
    if (addr.includes("chiang mai") || addr.includes("เชียงใหม่"))
      city = "Chiang Mai";
    else if (addr.includes("phuket") || addr.includes("ภูเก็ต"))
      city = "Phuket";
    else if (addr.includes("khon kaen") || addr.includes("ขอนแก่น"))
      city = "Khon Kaen";
    else if (addr.includes("chon buri") || addr.includes("ชลบุรี"))
      city = "Chon Buri";

    return {
      city,
      hospitalName: spot.hospitalName,
      hospital: spot.hospitalName,
      lat: spot.lat,
      lng: spot.lng,
      totalCases: spot.totalCases,
      severity,
      topSymptoms: topDiagnoses.length
        ? topDiagnoses
        : ["ยังไม่มีสถิติโรควิเคราะห์"],
    };
  });
});

function onSelectHospital(leafletSpot: any) {
  const matched = hotspots.value.find(
    (h) => h.hospitalName === leafletSpot.hospitalName,
  );
  if (matched) {
    selectedHospital.value = matched;
  }
}

// คาดการณ์สิทธิ์การแนะนำระบาดวิทยาจากโรคที่เสี่ยงสุด
const diseaseRecommendation = computed(() => {
  if (!selectedHospital.value) return "";

  // หาโรคที่มีผู้ป่วยสูงที่สุดในโรงพยาบาลนี้
  const sorted = Object.entries(selectedHospital.value.geminiAnalyses).sort(
    (a, b) => b[1] - a[1],
  );

  const topDiseaseEntry = sorted[0];
  if (!topDiseaseEntry) return "ยังไม่มีข้อมูลการวินิจฉัยโรคเพื่อสร้างคำแนะนำ";

  const topDisease = topDiseaseEntry[0];
  const count = topDiseaseEntry[1];

  let advice = `ตรวจพบผู้ป่วยโรค "${topDisease}" สะสมสูงสุดในสถานพยาบาลแห่งนี้จำนวน ${count} เคส. `;

  if (topDisease.includes("ไข้หวัดใหญ่") || topDisease.includes("Influenza")) {
    advice +=
      "แนะนำให้จัดเตรียมวัคซีนป้องกันไข้หวัดใหญ่ และรณรงค์ให้ผู้ที่มีอาการของระบบทางเดินหายใจสวมหน้ากากอนามัยในพื้นที่แออัดเพื่อความปลอดภัย";
  } else if (
    topDisease.includes("ไข้เลือดออก") ||
    topDisease.includes("Dengue")
  ) {
    advice +=
      "แนะนำให้ส่งทีม อสม. ลงพื้นที่กำจัดแหล่งน้ำขังที่เป็นแหล่งเพาะพันธุ์ยุงลายตัวนำโรคทันทีเพื่อสกัดกั้นคลัสเตอร์ระบาด";
  } else if (
    topDisease.includes("อาหารเป็นพิษ") ||
    topDisease.includes("Food Poisoning") ||
    topDisease.includes("ท้องเสีย") ||
    topDisease.includes("ท้องร่วง")
  ) {
    advice +=
      "แนะนำให้เร่งตรวจสอบมาตรฐานสุขาภิบาลร้านอาหารและโรงอาหารหลักในพื้นที่ รวมถึงแจกจ่ายสารเกลือแร่ฉุกเฉิน (ORS)";
  } else if (topDisease.includes("โควิด") || topDisease.includes("COVID")) {
    advice +=
      "แนะนำให้เปิดจุดคัดกรองเบื้องต้น จัดเตรียมชุดตรวจ ATK และควบคุมการระบายอากาศของสถานพยาบาลให้มีความปลอดภัย";
  } else {
    advice +=
      "แนะนำให้จัดส่งข้อมูลเฝ้าระวังนี้ไปยังศูนย์ควบคุมโรคระบาดท้องถิ่น ติดตามประวัติการเดินทางของผู้ป่วย และเตรียมเวชภัณฑ์ยารักษาตามอาการให้เพียงพอ";
  }

  return advice;
});

onMounted(() => {
  loadOutbreakData();
});
</script>

<template>
  <div
    class="flex-grow flex flex-col relative w-full h-full overflow-hidden bg-surface-dim text-on-surface font-body-md antialiased"
  >
    <!-- Top Nav Bar -->
    <header
      class="bg-surface-bright dark:bg-inverse-surface flex justify-between items-center w-full px-lg py-md sticky top-0 z-30 shadow-sm border-b border-surface-container transition-all duration-200"
    >
      <div class="flex items-center gap-md">
        <h1
          class="font-headline-md text-headline-md text-on-surface flex items-center gap-sm"
        >
          <span class="material-symbols-outlined text-secondary"
            >spatial_tracking</span
          >
          แผนที่เสี่ยงระบาด
        </h1>
      </div>

      <!-- Quick Metrics -->
      <div
        class="hidden md:flex items-center gap-lg text-xs text-on-surface-variant"
      >
        <div>
          <span
            class="block text-[10px] uppercase font-bold text-outline tracking-wider"
            >เคสยืนยันทั้งหมด (Confirmed)</span
          >
          <span class="font-data-mono text-on-surface font-bold text-sm"
            >{{ totalConfirmed }} เคส</span
          >
        </div>
        <div class="h-6 w-px bg-surface-variant"></div>
        <div v-if="topRisk">
          <span
            class="block text-[10px] uppercase font-bold text-outline tracking-wider"
            >พื้นที่เสี่ยงสูงสุด (Top Danger)</span
          >
          <span class="text-sm font-bold text-error flex items-center gap-1">
            <span class="material-symbols-outlined text-xs">warning</span>
            {{ topRisk.hospitalName }} ({{ topRisk.totalCases }} เคส)
          </span>
        </div>
      </div>

      <div class="flex items-center gap-sm">
        <NuxtLink
          to="/diagnose"
          class="px-md py-sm bg-primary text-on-primary hover:opacity-90 rounded-lg shadow-sm font-label-caps text-label-caps flex items-center gap-2 transition-all text-xs"
        >
          วิเคราะห์โรคผู้ป่วย
        </NuxtLink>
      </div>
    </header>

    <!-- Main Map Workspace -->
    <div class="flex-1 relative overflow-hidden bg-surface-dim">
      <!-- Leaflet Map Container -->
      <div class="absolute inset-0 z-0">
        <ClientOnly>
          <LeafletMap
            :hotspots="leafletHotspots"
            :fullCanvas="true"
            @select-city="onSelectHospital"
          />
          <template #fallback>
            <div
              class="w-full h-full flex flex-col items-center justify-center bg-surface-dim"
            >
              <div
                class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"
              ></div>
              <p class="text-on-surface-variant text-sm">
                กำลังโหลดแผนที่ GIS...
              </p>
            </div>
          </template>
        </ClientOnly>
      </div>

      <!-- FLOATING PANEL LEFT: Top Danger Location Card -->
      <div
        v-if="topRisk"
        class="absolute left-md top-md w-80 bg-surface-container-lowest/95 backdrop-blur-md rounded-full shadow-lg border border-outline-variant p-md z-20 animate-slide-in pointer-events-auto"
      >
        <div class="flex items-center gap-1.5 mb-sm">
          <span class="w-2.5 h-2.5 rounded-full bg-error animate-pulse"></span>
          <span
            class="font-label-caps text-[10px] text-error font-bold uppercase tracking-wider"
            >พื้นที่เสี่ยงสะสมสูงสุด (Top Danger Hub)</span
          >
        </div>

        <h3 class="font-headline-sm text-base font-bold text-on-surface mb-xs">
          {{ topRisk.hospitalName }}
        </h3>
        <p
          class="font-body-md text-[11px] text-on-surface-variant leading-normal flex items-start gap-1 mb-md"
        >
          <span
            class="material-symbols-outlined text-[13px] text-secondary shrink-0"
            >location_on</span
          >
          {{ topRisk.address }}
        </p>

        <div class="grid grid-cols-2 gap-sm mb-md">
          <div
            class="bg-surface-container-low border border-outline-variant/40 rounded-xl p-sm"
          >
            <span
              class="font-label-caps text-[10px] text-outline block uppercase mb-xs"
              >พิกัดแผนที่</span
            >
            <span class="font-data-mono text-xs text-on-surface font-bold">
              {{ topRisk.lat.toFixed(4) }}, {{ topRisk.lng.toFixed(4) }}
            </span>
          </div>
          <div
            class="bg-error-container/40 border border-error/20 rounded-xl p-sm"
          >
            <span
              class="font-label-caps text-[10px] text-error font-bold block uppercase mb-xs"
              >เคสสะสมทั้งหมด</span
            >
            <span
              class="font-data-mono text-sm text-error font-bold flex items-baseline gap-1"
            >
              {{ topRisk.totalCases }}
              <span class="text-[10px] font-normal text-on-surface-variant"
                >เคส</span
              >
            </span>
          </div>
        </div>

        <!-- AI Predicted Diseases breakdown -->
        <div>
          <span
            class="font-label-caps text-[10px] text-on-surface-variant block uppercase mb-sm font-bold"
            >สถิติโรคจากการวิเคราะห์ของ AI</span
          >
          <div class="space-y-sm max-h-[140px] overflow-y-auto pr-1">
            <div
              v-for="[disease, count] in Object.entries(
                topRisk.geminiAnalyses,
              ).sort((a, b) => b[1] - a[1])"
              :key="disease"
              class="text-xs"
            >
              <div
                class="flex justify-between font-body-md text-xs text-on-surface mb-xs"
              >
                <span>{{ disease }}</span>
                <span class="font-bold text-primary font-data-mono"
                  >{{ count }} ราย</span
                >
              </div>
              <div class="w-full bg-surface-variant rounded-full h-1.5">
                <div
                  class="bg-secondary h-1.5 rounded-full"
                  :style="{ width: `${(count / topRisk.totalCases) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- FLOATING PANEL RIGHT: Detailed patients and recommendation panel -->
      <div
        v-if="selectedHospital"
        class="absolute right-md top-md bottom-md w-96 bg-surface-container-lowest/95 backdrop-blur-md rounded-full shadow-lg border border-outline-variant flex flex-col z-20 animate-slide-in-right overflow-hidden pointer-events-auto"
      >
        <!-- Panel Header -->
        <div
          class="p-md border-b border-outline-variant/60 bg-surface-container-low"
        >
          <div class="flex justify-between items-start mb-sm">
            <div class="flex items-center gap-1.5">
              <span
                class="w-2.5 h-2.5 rounded-full"
                :class="
                  selectedHospital.totalCases >= 4
                    ? 'bg-error'
                    : selectedHospital.totalCases >= 1
                      ? 'bg-tertiary-fixed-dim'
                      : 'bg-secondary'
                "
              ></span>
              <span
                class="font-label-caps text-[10px] text-on-surface-variant font-bold uppercase tracking-wider"
                >ข้อมูลรายละเอียดพิกัด</span
              >
            </div>
            <button
              class="text-on-surface-variant hover:text-on-surface text-xl font-bold"
              @click="selectedHospital = null"
            >
              ×
            </button>
          </div>
          <h3 class="font-headline-sm text-base font-bold text-on-surface">
            {{ selectedHospital.hospitalName }}
          </h3>
          <p
            class="font-body-md text-[11px] text-on-surface-variant leading-relaxed mt-xs flex items-start gap-1"
          >
            <span
              class="material-symbols-outlined text-[13px] text-secondary shrink-0"
              >location_on</span
            >
            {{ selectedHospital.address }}
          </p>
        </div>

        <!-- Panel Body -->
        <div class="p-md flex-grow overflow-y-auto space-y-md custom-scrollbar">
          <!-- Stats Summary -->
          <div
            class="bg-surface border border-outline-variant/60 rounded-full p-md shadow-xs"
          >
            <h4
              class="font-label-caps text-[10px] text-on-surface-variant mb-xs uppercase tracking-wide font-bold"
            >
              สถิติจำนวนรวมของคนไข้
            </h4>
            <div
              class="flex justify-between items-center text-xs font-semibold"
            >
              <span class="text-on-surface-variant"
                >ยอดผู้ป่วยยืนยัน (Confirmed)</span
              >
              <span class="font-data-mono text-on-surface text-sm font-bold"
                >{{ selectedHospital.totalCases }} ราย</span
              >
            </div>
          </div>

          <!-- AI Advice -->
          <div
            class="bg-secondary-container/40 border border-secondary/20 rounded-full p-md"
          >
            <div class="flex items-start gap-sm">
              <span
                class="material-symbols-outlined text-secondary text-lg mt-0.5 animate-pulse"
                >tips_and_updates</span
              >
              <div>
                <span
                  class="font-label-caps text-[10px] text-on-secondary-fixed-variant block uppercase tracking-wider mb-xs font-bold"
                  >คำแนะนำระบาดวิทยาเชิงพื้นที่</span
                >
                <p class="font-body-md text-xs text-on-surface leading-relaxed">
                  {{ diseaseRecommendation }}
                </p>
              </div>
            </div>
          </div>

          <!-- Patient list in view -->
          <div>
            <h4
              class="font-headline-sm text-xs font-bold text-on-surface mb-sm flex items-center gap-1.5"
            >
              <span class="material-symbols-outlined text-sm text-secondary"
                >group</span
              >
              รายชื่อคนไข้ (ดึงข้อมูลจาก Database View)
            </h4>

            <div
              v-if="selectedHospital.patients.length === 0"
              class="text-center text-on-surface-variant text-xs italic py-6"
            >
              ยังไม่มีคนไข้ที่มีประวัติวินิจฉัยโรคในฐานข้อมูล
            </div>

            <div v-else class="space-y-sm">
              <div
                v-for="(pat, idx) in selectedHospital.patients"
                :key="idx"
                class="bg-surface-container-low hover:bg-surface-container border border-outline-variant/40 rounded-full p-md transition-all flex flex-col gap-xs"
              >
                <div class="flex justify-between items-center">
                  <span class="font-bold text-on-surface text-xs">{{
                    pat.patientName
                  }}</span>
                  <span
                    class="font-data-mono text-[10px] text-on-surface-variant"
                    >{{ new Date(pat.date).toLocaleDateString("th-TH") }}</span
                  >
                </div>
                <div
                  class="grid grid-cols-2 gap-sm text-[11px] text-on-surface-variant"
                >
                  <div>
                    <span
                      class="block font-label-caps text-[9px] text-outline uppercase tracking-wider font-bold"
                      >อาการแรกรับ</span
                    >
                    <span class="font-body-md text-on-surface">{{
                      pat.symptom
                    }}</span>
                  </div>
                  <div>
                    <span
                      class="block font-label-caps text-[9px] text-outline uppercase tracking-wider font-bold"
                      >วินิจฉัยจาก AI</span
                    >
                    <span class="font-bold text-secondary">{{
                      pat.disease
                    }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Panel Footer -->
        <div
          class="p-md border-t border-outline-variant/60 bg-surface-container-low"
        >
          <button
            @click="
              router.push({
                path: '/explorer',
                query: { search: selectedHospital.hospitalName },
              })
            "
            class="w-full bg-surface-container-lowest border border-outline-variant hover:bg-surface-container-low text-on-surface py-sm rounded-lg font-label-caps text-label-caps flex items-center justify-center gap-2 transition-colors text-xs font-bold"
          >
            <span class="material-symbols-outlined text-sm">database</span>
            เจาะลึกฐานข้อมูลคนไข้เพิ่มเติม
          </button>
        </div>
      </div>

      <!-- LEGEND / INFO BAR (Bottom Right) -->
      <div
        class="absolute flex justify-end bottom-md left-md bg-surface-container-lowest rounded-lg shadow-sm border border-outline-variant p-sm z-20 flex gap-md"
      >
        <div class="flex items-center gap-1">
          <span class="w-3 h-3 rounded-full bg-error"></span>
          <span
            class="font-data-mono text-[11px] text-on-surface-variant font-bold"
            >ปริมาณสูง (>= 4 เคส)</span
          >
        </div>
        <div class="flex items-center gap-1">
          <span class="w-3 h-3 rounded-full bg-tertiary-fixed-dim"></span>
          <span
            class="font-data-mono text-[11px] text-on-surface-variant font-bold"
            >เฝ้าระวัง (>= 1 เคส)</span
          >
        </div>
        <div class="flex items-center gap-1">
          <span class="w-3 h-3 rounded-full bg-secondary-fixed-dim"></span>
          <span
            class="font-data-mono text-[11px] text-on-surface-variant font-bold"
            >ระดับปกติ</span
          >
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
  from {
    transform: translateX(-20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideInRight {
  from {
    transform: translateX(20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Custom Scrollbar for list items */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
