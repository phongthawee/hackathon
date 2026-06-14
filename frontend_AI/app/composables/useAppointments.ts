//composables/useAppointments.ts
import type { AppGetResponse } from "~/model/appointments/response/app_get_res";

export const useAppointments = () => {
    const supabaseClient = useSupabaseClient()
    const fetchAppointments = async () => {
        // 1. ดึงนัดหมายที่เป็น CONFIRMED ทั้งหมด
        const { data: appointmentsData, error: appointmentsError } = await supabaseClient
            .from("appointments")
            .select("apt_id,user_id,doctor_id,symptom")
            .eq("status", "CONFIRMED");

        if (appointmentsError) {
            throw appointmentsError;
        }

        // 2. ดึงลิสต์ apt_id ที่ถูกวิเคราะห์ไปแล้วจาก ai_diagnoses
        const { data: diagnosedData, error: diagnosedError } = await (supabaseClient as any)
            .from("ai_diagnoses")
            .select("apt_id");

        if (diagnosedError) {
            console.warn("[fetchAppointments] Error fetching diagnosed apt_ids:", diagnosedError);
            return appointmentsData as AppGetResponse[];
        }

        const diagnosedSet = new Set((diagnosedData || []).map((d: any) => d.apt_id));

        // 3. คืนค่าเฉพาะคนที่ยังไม่ถูกวิเคราะห์โรค
        const filteredAppointments = (appointmentsData || []).filter(
            (apt: any) => !diagnosedSet.has(apt.apt_id)
        );

        return filteredAppointments as AppGetResponse[];
    };

    const saveDiagnosis = async (aptId: string, disease: string) => {
        // Generate a random UUID safely
        const diagnosisId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });

        // 1. ตรวจสอบก่อนว่ามีข้อมูล apt_id นี้อยู่ในระบบแล้วหรือไม่
        const { data: existing, error: checkError } = await (supabaseClient as any)
            .from("ai_diagnoses")
            .select("apt_id")
            .eq("apt_id", aptId)
            .maybeSingle();
            
        if (checkError) {
            console.warn(`[saveDiagnosis] Error checking duplicates for apt_id "${aptId}":`, checkError);
        }

        if (existing) {
            console.log(`[saveDiagnosis] apt_id "${aptId}" already exists in Database. Updating entry.`);
            const { data, error } = await (supabaseClient as any)
                .from("ai_diagnoses")
                .update({
                    gemini_analysis: disease,
                    analyzed_at: new Date().toISOString()
                })
                .eq("apt_id", aptId);

            if (error) {
                throw error;
            }
            return { success: true, updated: true, data };
        }

        // 2. หากยังไม่มี จึงทำการบันทึกข้อมูลตัวใหม่ลงไป
        const { data, error } = await (supabaseClient as any)
            .from("ai_diagnoses")
            .insert({
                diagnosis_id: diagnosisId,
                apt_id: aptId,
                gemini_analysis: disease,
                analyzed_at: new Date().toISOString()
            })

        if (error) {
            throw error;
        }
        return data;
    };

    return {
        fetchAppointments,
        saveDiagnosis
    }
};
