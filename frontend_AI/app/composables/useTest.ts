export const useTest = () => {
    // 1. เรียกใช้งาน Supabase Client ในระดับ Composable
    const supabase = useSupabaseClient()

    // 2. ดึงข้อมูลทั้งหมด (Fetch All)
    const getDoctors = async () => {
        const { data, error } = await supabase
            .from('doctors')
            .select('*')

        if (error) {
            console.error('Error fetching doctors:', error)
            return []
        }
        return data
    }

    // 3. ดึงข้อมูลแบบมีเงื่อนไข (Filter)
    const getHospitalLocations = async () => {
        const { data, error } = await supabase
            .from('locations')
            .select('*')
            .eq('type', 'HOSPITAL') // ตัวอย่าง .eq() หรือ filter อื่นๆ

        if (error) {
            console.error('Error fetching locations:', error)
            return []
        }
        return data
    }

    return {
        getDoctors,
        getHospitalLocations
    }
}
