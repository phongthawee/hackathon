import type { AppGetResponse } from "~/model/appointments/response/app_get_res";

export const useAppointments = () => {
    const supabaseClient = useSupabaseClient()
    const fetchAppointments = async () => {
        const { data, error } = await supabaseClient
            .from("appointments")
            .select("*")
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