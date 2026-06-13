import type { AppGetResponse } from "~/model/appointments/response/app_get_res";

export const useAppointments = () => {
    const supabaseClient = useSupabaseClient()
    const fetchAppointments = async () => {
        const { data, error } = await supabaseClient
            .from("appointments")
            .select("apt_id,user_id,doctor_id,symptom")
            //สร้างเงื่อนไขด้วยว่า status ต้อง = confirmed
            .eq("status", "CONFIRMED")
        if (error) {
            throw error;
        }
        let response = data as AppGetResponse[];
        return response;
    };

    return {
        fetchAppointments
    }
};