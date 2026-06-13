<script setup>
// 1. เรียกใช้งาน Supabase Client
const supabase = useSupabaseClient()

// 2. ดึงข้อมูลสถานที่ (Locations)
const { data: locations, pending: loadingLocations } = await useAsyncData('locations', async () => {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('type', 'HOSPITAL') // กรองเอาเฉพาะโรงพยาบาล
  
  if (error) console.error('Error fetching locations:', error)
  return data
})

// 3. ดึงข้อมูลแพทย์ (Doctors)
const { data: doctors, pending: loadingDoctors } = await useAsyncData('doctors', async () => {
  const { data, error } = await supabase
    .from('doctors')
    .select('*')
  
  if (error) console.error('Error fetching doctors:', error)
  return data
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 p-8 font-['Inter']">
    <div class="max-w-7xl mx-auto">
      
      <header class="mb-10">
        <h1 class="text-3xl font-bold text-slate-800 tracking-tight">Health Radar Dashboard</h1>
        <p class="text-slate-500 mt-2">Surveillance & Outbreak System</p>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div class="flex items-center gap-2 mb-6">
            <span class="material-symbols-outlined text-blue-500">local_hospital</span>
            <h2 class="text-xl font-semibold text-slate-700">เครือข่ายโรงพยาบาล</h2>
          </div>
          
          <div v-if="loadingLocations" class="text-slate-400">กำลังโหลดข้อมูล...</div>
          <div v-else class="space-y-4">
            <div 
              v-for="loc in locations" 
              :key="loc.location_id"
              class="p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <h3 class="font-medium text-slate-800">{{ loc.name }}</h3>
              <p class="text-sm text-slate-500 mt-1 line-clamp-1">{{ loc.address }}</p>
              <div class="mt-2 text-xs font-medium text-emerald-600 bg-emerald-50 inline-block px-2 py-1 rounded">
                {{ loc.operating_hours }}
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div class="flex items-center gap-2 mb-6">
            <span class="material-symbols-outlined text-indigo-500">stethoscope</span>
            <h2 class="text-xl font-semibold text-slate-700">บุคลากรทางการแพทย์</h2>
          </div>

          <div v-if="loadingDoctors" class="text-slate-400">กำลังโหลดข้อมูล...</div>
          <div v-else class="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            <div 
              v-for="doc in doctors" 
              :key="doc.doctor_id"
              class="flex items-center justify-between p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <div>
                <h3 class="font-medium text-slate-800">{{ doc.name }}</h3>
                <p class="text-sm text-indigo-600 font-medium">{{ doc.department }}</p>
              </div>
              <div class="text-right">
                <p class="text-xs text-slate-500">{{ doc.hospital }}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* แต่ง Scrollbar เล็กน้อยสำหรับกล่องรายชื่อหมอ */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: #f1f5f9; 
  border-radius: 4px;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1; 
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8; 
}
</style>