export const useLocation = () => {

    const supabaseClient = useSupabaseClient()
    const fetchLocation = async () => {
        const { data, error } = await supabaseClient
            .from("locations")
            .select("*")
        if (error) {
            throw error;
        }
        let response = data;
        return response;
    };

    return {
        fetchLocation
    }

}