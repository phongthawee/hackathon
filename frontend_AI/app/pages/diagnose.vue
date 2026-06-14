//pages/diagnose
<script setup lang="ts">
import { ref, onMounted } from "vue";

const { fetchAppointments, saveDiagnosis } = useAppointments();

interface Appointment {
  apt_id: string;
  user_id: string;
  doctor_id: string;
  symptom: string;
}

const appointments = ref<Appointment[]>([]);
const loadingAppointments = ref(false);
const errorMsg = ref("");

// ตัวแปรสำหรับเก็บผลลัพธ์การวินิจฉัย (diagnosisResults)
// โครงสร้างคือ { [apt_id]: "ชื่อโรคที่วิเคราะห์ได้" }
const diagnosisResults = ref<Record<string, string>>({});
const loadingDiagnose = ref<Record<string, boolean>>({});

// ตัวแปรเก็บข้อมูลคนป่วยที่ได้รับการวิเคราะห์แล้วเพื่อนำไปใช้ต่อได้ (ตามคำขอของผู้ใช้)
interface DiagnosedPatient extends Appointment {
  predictedDisease: string;
}
const diagnosedPatientsList = ref<DiagnosedPatient[]>([]);

// สร้างแถบล็อกจำลองในหน้าจอควบคู่กับ console.log เพื่อเพิ่มความพรีเมียม
const terminalLogs = ref<
  {
    time: string;
    type: "info" | "success" | "error" | "system";
    text: string;
  }[]
>([]);

function logMessage(
  text: string,
  type: "info" | "success" | "error" | "system" = "info",
) {
  const time = new Date().toLocaleTimeString();
  terminalLogs.value.unshift({ time, type, text });

  // พ่นออกเบราว์เซอร์ Console ตามความต้องการของนักพัฒนา
  if (type === "success") {
    console.log(
      `%c[Gemini AI Success ${time}] ${text}`,
      "color: #10B981; font-weight: bold; font-size: 13px;",
    );
  } else if (type === "error") {
    console.error(`[Gemini AI Error ${time}] ${text}`);
  } else if (type === "system") {
    console.log(
      `%c[System ${time}] ${text}`,
      "color: #8B5CF6; font-weight: bold;",
    );
  } else {
    console.log(`[Gemini AI Info ${time}] ${text}`);
  }
}

async function loadData() {
  loadingAppointments.value = true;
  errorMsg.value = "";
  logMessage("กำลังเริ่มดึงข้อมูลรายชื่อผู้ป่วย...", "system");
  try {
    const data = await fetchAppointments();
    appointments.value = data as Appointment[];
    logMessage(
      `ดึงข้อมูลรายชื่อผู้ป่วยสำเร็จ: พบทั้งหมด ${appointments.value.length} รายที่มีสถานะ CONFIRMED`,
      "success",
    );
  } catch (err: any) {
    errorMsg.value = "ไม่สามารถดึงข้อมูลนัดหมายผู้ป่วยได้";
    logMessage(`เกิดข้อผิดพลาดในการโหลดข้อมูล: ${err.message}`, "error");
  } finally {
    loadingAppointments.value = false;
  }
}

async function diagnosePatient(aptId: string, symptom: string) {
  if (loadingDiagnose.value[aptId]) return;

  loadingDiagnose.value[aptId] = true;
  logMessage(
    `[apt_id: ${aptId}] เริ่มส่งข้อมูลอาการไปให้ Gemini: "${symptom}"`,
    "info",
  );

  try {
    const data = await $fetch<{
      success: boolean;
      disease?: string;
      error?: string;
      isMock?: boolean;
      warning?: string;
    }>("/api/diagnose", {
      method: "POST",
      body: { symptom },
    });

    if (data.success && data.disease) {
      if (data.warning) {
        logMessage(data.warning, "system");
      }
      // เก็บค่าผลลัพธ์การวินิจฉัยลงในตัวแปรหลัก (diagnosisResults)
      diagnosisResults.value[aptId] = data.disease;

      // บันทึกผลการวินิจฉัยลงใน Database (ตาราง ai_diagnoses)
      try {
        const dbResult: any = await saveDiagnosis(aptId, data.disease);
        if (dbResult && dbResult.skipped) {
          logMessage(
            `[apt_id: ${aptId}] ข้อมูลผลวินิจฉัยนี้มีอยู่ในระบบแล้ว (ข้ามการบันทึกซ้ำ)`,
            "info",
          );
        } else {
          logMessage(
            `[apt_id: ${aptId}] บันทึกผลวินิจฉัยลง Database สำเร็จ`,
            "success",
          );
        }
      } catch (dbErr: any) {
        logMessage(
          `[apt_id: ${aptId}] เกิดข้อผิดพลาดในการบันทึกข้อมูลลง Database: ${dbErr.message}`,
          "error",
        );
      }

      // เก็บรวบรวมข้อมูลคนไข้ที่ได้รับการวินิจฉัยแล้วลงในตัวแปรสำหรับนำไปใช้ต่อ
      const patientData = appointments.value.find(
        (apt) => apt.apt_id === aptId,
      );
      if (patientData) {
        const index = diagnosedPatientsList.value.findIndex(
          (p) => p.apt_id === aptId,
        );
        const updatedEntry = { ...patientData, predictedDisease: data.disease };
        if (index > -1) {
          diagnosedPatientsList.value[index] = updatedEntry;
        } else {
          diagnosedPatientsList.value.push(updatedEntry);
        }

        // พิมพ์ log ตัวแปรนั้นออกมาให้ตรวจสอบ
        console.log(
          `%c[diagnosedPatientsList updated]`,
          "color: #06B6D4; font-weight: bold;",
          JSON.parse(JSON.stringify(diagnosedPatientsList.value)),
        );
      }

      const source = data.isMock ? "Mock API" : "Gemini 3.5";
      logMessage(
        `[apt_id: ${aptId}] วิเคราะห์เสร็จสิ้น (${source}) -> โรคที่มีสิทธิ์เป็นมากที่สุด: ${data.disease}`,
        "success",
      );
      logMessage(
        `ตัวแปร diagnosedPatientsList อัปเดตแล้ว (รวมทั้งหมด ${diagnosedPatientsList.value.length} เคส) -> ตรวจดูผลลัพธ์ใน DevTools Console`,
        "info",
      );
    } else {
      logMessage(
        `[apt_id: ${aptId}] วิเคราะห์ล้มเหลว: ${data.error || "ไม่มีข้อมูลส่งกลับจาก API"}`,
        "error",
      );
    }
  } catch (err: any) {
    logMessage(
      `[apt_id: ${aptId}] เกิดข้อผิดพลาดทางเทคนิค: ${err.message}`,
      "error",
    );
  } finally {
    loadingDiagnose.value[aptId] = false;
  }
}

async function diagnoseAll() {
  if (appointments.value.length === 0) return;

  const patientsToDiagnose = appointments.value.map((apt) => ({
    apt_id: apt.apt_id,
    symptom: apt.symptom,
  }));

  logMessage(
    `กำลังส่งวิเคราะห์ประวัติคนไข้ทั้งหมด ${patientsToDiagnose.length} รายในแบบกลุ่ม (Batch) ไปยัง Gemini...`,
    "system",
  );

  // แสดง Loading ทุกคนในระหว่างดำเนินการ
  patientsToDiagnose.forEach((p) => {
    loadingDiagnose.value[p.apt_id] = true;
  });

  try {
    const data = await $fetch<{
      success: boolean;
      diagnoses?: { apt_id: string; disease: string }[];
      error?: string;
    }>("/api/diagnose-batch", {
      method: "POST",
      body: { patients: patientsToDiagnose },
    });

    if (data.success && data.diagnoses) {
      if ((data as any).warning) {
        logMessage((data as any).warning, "system");
      }
      logMessage(
        `ได้รับผลวิเคราะห์ประวัติคนไข้จาก AI ครบถ้วนแล้ว เริ่มทำการบันทึกลงฐานข้อมูล...`,
        "success",
      );

      for (const item of data.diagnoses) {
        const aptId = item.apt_id;
        const disease = item.disease;

        // บันทึกผลลัพธ์ลงตัวแปรผลลัพธ์หลัก
        diagnosisResults.value[aptId] = disease;

        // ทำการตรวจเช็คและบันทึกลง Database (ใน composable จะดักไม่ให้บันทึกซ้ำ)
        try {
          const dbResult: any = await saveDiagnosis(aptId, disease);
          if (dbResult && dbResult.skipped) {
            logMessage(
              `[apt_id: ${aptId}] ข้อมูลมีอยู่แล้ว (ข้ามการบันทึกเข้า DB)`,
              "info",
            );
          } else {
            logMessage(
              `[apt_id: ${aptId}] บันทึกผลวินิจฉัยลง Database สำเร็จ`,
              "success",
            );
          }
        } catch (dbErr: any) {
          logMessage(
            `[apt_id: ${aptId}] บันทึกลง Database ล้มเหลว: ${dbErr.message}`,
            "error",
          );
        }

        // อัปเดตในตัวแปรสำหรับนำไปใช้ต่อ
        const patientData = appointments.value.find(
          (apt) => apt.apt_id === aptId,
        );
        if (patientData) {
          const index = diagnosedPatientsList.value.findIndex(
            (p) => p.apt_id === aptId,
          );
          const updatedEntry = { ...patientData, predictedDisease: disease };
          if (index > -1) {
            diagnosedPatientsList.value[index] = updatedEntry;
          } else {
            diagnosedPatientsList.value.push(updatedEntry);
          }
        }
      }

      console.log(
        `%c[diagnosedPatientsList updated]`,
        "color: #06B6D4; font-weight: bold;",
        JSON.parse(JSON.stringify(diagnosedPatientsList.value)),
      );
      logMessage(
        `วิเคราะห์โรคคนไข้และอัปเดตตัวแปร diagnosedPatientsList ครบถ้วนเป็นที่เรียบร้อย (รวม ${diagnosedPatientsList.value.length} เคส)`,
        "system",
      );
    } else {
      logMessage(
        `การวิเคราะห์แบบกลุ่มล้มเหลว: ${data.error || "ไม่มีข้อมูลตอบกลับจาก API"}`,
        "error",
      );
    }
  } catch (err: any) {
    logMessage(`เกิดข้อผิดพลาดในการดึงข้อมูลแบบกลุ่ม: ${err.message}`, "error");
  } finally {
    // ปิดสถานะ Loading ทุกคน
    patientsToDiagnose.forEach((p) => {
      loadingDiagnose.value[p.apt_id] = false;
    });
  }
}

const editingAptId = ref<string | null>(null);
const editDiseaseText = ref("");

function startEdit(aptId: string, currentDisease: string) {
  editingAptId.value = aptId;
  editDiseaseText.value = currentDisease;
}

function cancelEdit() {
  editingAptId.value = null;
  editDiseaseText.value = "";
}

async function saveManualEdit(aptId: string) {
  if (!editDiseaseText.value.trim()) return;

  logMessage(
    `[apt_id: ${aptId}] กำลังแก้ไขผลวินิจฉัยด้วยตนเองเป็น "${editDiseaseText.value}"...`,
    "info",
  );
  try {
    const dbResult: any = await saveDiagnosis(aptId, editDiseaseText.value);
    diagnosisResults.value[aptId] = editDiseaseText.value;

    // อัปเดตในตัวแปรสำหรับนำไปใช้ต่อ
    const patientData = appointments.value.find((apt) => apt.apt_id === aptId);
    if (patientData) {
      const index = diagnosedPatientsList.value.findIndex(
        (p) => p.apt_id === aptId,
      );
      const updatedEntry = {
        ...patientData,
        predictedDisease: editDiseaseText.value,
      };
      if (index > -1) {
        diagnosedPatientsList.value[index] = updatedEntry;
      } else {
        diagnosedPatientsList.value.push(updatedEntry);
      }
    }

    if (dbResult && dbResult.updated) {
      logMessage(
        `[apt_id: ${aptId}] อัปเดตการแก้ไขผลวินิจฉัยลง Database สำเร็จ`,
        "success",
      );
    } else {
      logMessage(
        `[apt_id: ${aptId}] บันทึกการแก้ไขผลวินิจฉัยลง Database สำเร็จ`,
        "success",
      );
    }
    editingAptId.value = null;
  } catch (err: any) {
    logMessage(
      `[apt_id: ${aptId}] เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${err.message}`,
      "error",
    );
  }
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="flex flex-col gap-lg">
    <!-- Header -->
    <div
      class="flex flex-col md:flex-row md:items-end justify-between gap-md mb-xs"
    >
      <div>
        <h1
          class="font-display-lg text-display-lg text-on-surface mb-xs flex items-center gap-sm"
        >
          <span class="material-symbols-outlined text-[32px] text-primary"
            >psychology</span
          >
          วิเคราะห์โรคด้วย AI
        </h1>
        <p class="font-body-md text-body-md text-on-surface-variant">
          วิเคราะห์ความเสี่ยงโรคและอาการของผู้ป่วยที่มีสถานะการนัดหมายสมบูรณ์
          (Confirmed Cases) ด้วยปัญญาประดิษฐ์
        </p>
      </div>

      <!-- Action Buttons / Badges -->
      <div class="flex items-center gap-sm flex-wrap">
        <!-- Status Badge -->
        <div
          class="hidden sm:flex items-center gap-xs bg-surface-container border border-surface-variant rounded-full px-md py-sm"
        >
          <span
            class="w-2 h-2 rounded-full bg-secondary-fixed-dim animate-pulse"
          ></span>
          <span class="text-[11px] text-on-surface-variant font-medium"
            >Gemini AI เชื่อมต่อแล้ว</span
          >
        </div>

        <!-- Batch Diagnose Button -->
        <!-- <button
          @click="diagnoseAll"
          :disabled="appointments.length === 0 || loadingAppointments"
          class="bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed py-sm px-md rounded-full font-label-caps text-label-caps flex items-center gap-xs transition-all shadow-sm font-bold text-xs"
        >
          <span class="material-symbols-outlined text-[18px]">clinical_aesthetics</span>
          วิเคราะห์กลุ่ม
        </button> -->

        <!-- Refresh Button -->
        <button
          @click="loadData"
          :disabled="loadingAppointments"
          class="p-sm bg-surface-container-lowest border border-surface-variant text-on-surface hover:bg-surface-container disabled:opacity-50 rounded-full transition-colors flex items-center"
          title="โหลดข้อมูลใหม่"
        >
          <span
            class="material-symbols-outlined text-[18px]"
            :class="{ 'animate-spin': loadingAppointments }"
            >refresh</span
          >
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-md">
      <!-- ฝั่งซ้าย/กลาง: แสดงรายชื่อผู้ป่วยและการวินิจฉัย -->
      <div class="lg:col-span-2 space-y-md">
        <h2
          class="font-headline-sm text-headline-sm text-on-surface flex items-center gap-sm"
        >
          <span class="material-symbols-outlined text-primary"
            >patient_list</span
          >
          รายชื่อผู้ป่วยที่ยืนยันแล้ว
        </h2>

        <!-- สถานะกำลังโหลดผู้ป่วย -->
        <div
          v-if="loadingAppointments"
          class="bg-surface-container-lowest border border-surface-variant rounded-xl p-xl text-center shadow-sm"
        >
          <div class="relative w-12 h-12 mx-auto mb-md">
            <div
              class="absolute inset-0 rounded-full border-4 border-surface-variant"
            ></div>
            <div
              class="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
            ></div>
          </div>
          <p class="text-on-surface-variant text-sm">
            กำลังดึงข้อมูลผู้ป่วยจากฐานข้อมูล...
          </p>
        </div>

        <!-- กรณีเกิดข้อผิดพลาดในการโหลดข้อมูล -->
        <div
          v-else-if="errorMsg"
          class="bg-error-container/30 border border-error/20 rounded-xl p-lg text-center shadow-sm"
        >
          <span class="material-symbols-outlined text-error text-[40px] mb-sm"
            >warning</span
          >
          <p class="text-on-error-container font-medium text-sm">
            {{ errorMsg }}
          </p>
          <button
            @click="loadData"
            class="mt-md px-md py-sm bg-error text-on-error text-xs font-bold rounded-full hover:bg-error/90 transition-all"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>

        <!-- กรณีไม่มีข้อมูลคนไข้Confirmed -->
        <div
          v-else-if="appointments.length === 0"
          class="bg-surface-container-lowest border border-surface-variant rounded-xl p-xl text-center shadow-sm"
        >
          <span class="material-symbols-outlined text-outline text-[48px] mb-sm"
            >assignment_ind</span
          >
          <p class="text-on-surface-variant text-sm">
            ไม่พบรายชื่อผู้ป่วยที่มีสถานะ CONFIRMED ในระบบขณะนี้
          </p>
        </div>

        <!-- รายชื่อการ์ดผู้ป่วย -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div
            v-for="apt in appointments"
            :key="apt.apt_id"
            class="bg-surface-container-lowest border border-surface-variant rounded-xl p-md shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 flex flex-col justify-between group"
          >
            <div>
              <!-- ข้อมูลบัตรผู้ป่วย -->
              <div class="flex justify-between items-start mb-md">
                <div class="flex items-center gap-sm">
                  <div
                    class="w-9 h-9 rounded-full bg-primary-fixed text-on-primary-fixed font-bold text-xs flex items-center justify-center animate-pulse"
                  >
                    P
                  </div>
                  <div>
                    <h4 class="font-bold text-on-surface text-xs leading-none">
                      ผู้ป่วย: {{ apt.user_id }}
                    </h4>
                    <span class="text-[10px] text-outline">
                      รหัสนัดหมาย: {{ apt.apt_id }}
                    </span>
                  </div>
                </div>
                <span
                  class="text-[10px] font-bold px-sm py-0.5 rounded-full bg-secondary-container/50 text-on-secondary-container border border-secondary/20"
                >
                  ยืนยันแล้ว
                </span>
              </div>

              <!-- อาการผู้ป่วย -->
              <div
                class="bg-surface-container-low rounded-lg p-sm border border-surface-variant/40 mb-md"
              >
                <span
                  class="text-outline text-[9px] font-bold block uppercase tracking-wider mb-1"
                >
                  อาการที่รายงาน
                </span>
                <p class="text-xs text-on-surface font-medium leading-relaxed">
                  {{ apt.symptom }}
                </p>
              </div>
            </div>

            <!-- ผลลัพธ์วิเคราะห์โรค / ปุ่มทำงาน -->
            <div class="border-t border-surface-variant pt-sm mt-auto">
              <div v-if="diagnosisResults[apt.apt_id]">
                <!-- โหมดแก้ไขผลการวินิจฉัย -->
                <div
                  v-if="editingAptId === apt.apt_id"
                  class="bg-surface-container p-sm border border-primary/20 rounded-lg space-y-sm animate-fadeIn"
                >
                  <span
                    class="text-primary text-[9px] font-bold block uppercase tracking-wider flex items-center gap-xs"
                  >
                    <span class="material-symbols-outlined text-[12px]"
                      >edit</span
                    >
                    แก้ไขผลวิเคราะห์โรค
                  </span>
                  <input
                    v-model="editDiseaseText"
                    type="text"
                    class="w-full bg-surface-container-lowest border border-surface-variant rounded-md px-sm py-xs text-xs text-on-surface focus:outline-none focus:border-primary"
                    placeholder="ระบุโรคเพื่อแก้ไข..."
                    @keyup.enter="saveManualEdit(apt.apt_id)"
                  />
                  <div class="flex justify-end gap-xs">
                    <button
                      @click="cancelEdit"
                      class="px-sm py-1 bg-surface-variant hover:bg-surface-dim text-on-surface-variant text-[10px] font-bold rounded"
                    >
                      ยกเลิก
                    </button>
                    <button
                      @click="saveManualEdit(apt.apt_id)"
                      class="px-sm py-1 bg-primary text-on-primary hover:bg-primary/95 text-[10px] font-bold rounded"
                    >
                      บันทึก
                    </button>
                  </div>
                </div>

                <!-- โหมดแสดงผลการวินิจฉัยปกติพร้อมปุ่มแก้ไข -->
                <div
                  v-else
                  class="bg-secondary-container/10 border border-secondary-container/30 rounded-lg p-sm flex justify-between items-start gap-sm animate-fadeIn"
                >
                  <div class="flex-1">
                    <span
                      class="text-on-secondary-container text-[9px] font-bold block uppercase tracking-wider mb-0.5 flex items-center gap-xs"
                    >
                      <span class="material-symbols-outlined text-[12px]"
                        >insights</span
                      >
                      ผลวิเคราะห์โรคจาก AI
                    </span>
                    <p class="text-xs font-bold text-on-surface leading-tight">
                      {{ diagnosisResults[apt.apt_id] }}
                    </p>
                  </div>
                  <button
                    @click="
                      startEdit(apt.apt_id, diagnosisResults[apt.apt_id] || '')
                    "
                    class="p-xs text-on-surface-variant hover:text-primary hover:bg-surface-container rounded transition-colors"
                    title="แก้ไขผลลัพธ์นี้"
                  >
                    <span class="material-symbols-outlined text-[14px]"
                      >edit</span
                    >
                  </button>
                </div>
              </div>
              <div
                v-else-if="loadingDiagnose[apt.apt_id]"
                class="bg-primary/5 border border-primary/10 rounded-lg p-sm flex items-center justify-center gap-sm"
              >
                <div
                  class="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin"
                ></div>
                <span class="text-xs text-on-surface-variant font-medium"
                  >กำลังส่งวิเคราะห์ด้วย Gemini...</span
                >
              </div>
              <div v-else class="flex items-center justify-between gap-sm">
                <span class="text-[11px] text-outline flex items-center gap-xs">
                  <span class="material-symbols-outlined text-[14px]"
                    >hourglass_empty</span
                  >
                  รอดำเนินการ
                </span>
                <button
                  @click="diagnosePatient(apt.apt_id, apt.symptom)"
                  class="bg-surface-container border border-surface-variant hover:bg-primary hover:text-on-primary hover:border-primary text-on-surface px-md py-sm rounded-lg text-xs font-bold transition-all flex items-center gap-xs active:scale-95"
                >
                  <!-- <span class="material-symbols-outlined text-[14px]"
                    >clinical_aesthetics</span
                  > -->
                  วิเคราะห์โรค
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ฝั่งขวา: Real-time Developer Logs / Console Output -->
      <div class="lg:col-span-1 space-y-md">
        <h2
          class="font-headline-sm text-headline-sm text-on-surface flex items-center gap-sm"
        >
          <span class="material-symbols-outlined text-primary">terminal</span>
          บันทึกการทำงานระบบ
        </h2>

        <div
          class="bg-surface-container-lowest border border-surface-variant rounded-xl p-md shadow-sm flex flex-col"
        >
          <div
            class="flex items-center justify-between border-b border-surface-variant pb-sm mb-md"
          >
            <div class="flex items-center gap-xs">
              <span class="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></span>
              <span class="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></span>
              <span class="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></span>
            </div>
            <span class="text-[10px] text-outline font-mono"
              >gemini_agent.sh</span
            >
          </div>

          <!-- กล่องล็อกแบบคอมมานด์ไลน์ -->
          <div
            class="h-[400px] overflow-y-auto font-mono text-xs leading-relaxed space-y-sm pr-xs custom-scrollbar"
          >
            <div
              v-for="(log, idx) in terminalLogs"
              :key="idx"
              class="border-b border-surface-variant/30 pb-sm animate-fadeIn"
            >
              <div
                class="flex items-center gap-sm text-[10px] text-outline mb-0.5"
              >
                <span>[{{ log.time }}]</span>
                <span
                  class="px-sm py-0.2 rounded text-[9px] font-bold border"
                  :class="{
                    'text-[#00714d] border-secondary/20 bg-secondary/5':
                      log.type === 'success',
                    'text-error border-error/20 bg-error/5':
                      log.type === 'error',
                    'text-primary border-primary/20 bg-primary/5':
                      log.type === 'system',
                    'text-on-surface-variant border-surface-variant/40 bg-surface-container-low':
                      log.type === 'info',
                  }"
                  >{{ log.type.toUpperCase() }}</span
                >
              </div>
              <p class="text-on-surface font-medium break-words">
                {{ log.text }}
              </p>
            </div>

            <!-- เริ่มต้นว่างเปล่า -->
            <div
              v-if="terminalLogs.length === 0"
              class="text-outline italic py-lg text-center"
            >
              รอดำเนินการวิเคราะห์เพื่อบันทึกการทำงาน...
            </div>
          </div>
        </div>

        <div class="bg-primary/5 border border-primary/10 rounded-xl p-md">
          <div class="flex gap-sm">
            <span
              class="material-symbols-outlined text-primary text-[20px] shrink-0"
              >info</span
            >
            <div class="text-[11px] text-on-surface-variant leading-normal">
              <p class="font-bold text-on-surface mb-0.5">คำแนะนำระบบ:</p>
              กดปุ่ม <strong>"F12"</strong> บนแป้นพิมพ์เพื่อเปิด
              <strong>Console</strong> ของเบราว์เซอร์
              เพื่อดูความคืบหน้าของอาร์เรย์
              <code
                class="bg-surface-container border border-surface-variant px-1 rounded text-[10px] font-mono"
                >diagnosedPatientsList</code
              >
              ที่ถูกจัดเก็บไว้อย่างเป็นระเบียบ
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
  background: #c6c6cd;
  border-radius: 2px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #76777d;
}
</style>
