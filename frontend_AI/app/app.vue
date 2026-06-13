<template>
  <div class="flex min-h-screen w-full bg-background text-on-background font-body-md antialiased overflow-x-hidden">
    <!-- SideNavBar -->
    <aside class="bg-surface dark:bg-inverse-surface shadow-sm h-screen w-64 fixed left-0 top-0 z-40 border-r border-surface-variant flex flex-col py-lg px-md">
      <!-- Logo Identity -->
      <div class="flex items-center gap-sm mb-xl">
        <div class="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-display-lg text-display-lg">
          <span class="material-symbols-outlined text-on-primary-container" style="font-size: 24px;">monitor_heart</span>
        </div>
        <div>
          <h2 class="font-headline-sm text-headline-sm text-primary font-bold">Health Radar</h2>
        </div>
      </div>

      <!-- User Profile Card -->
      <div class="flex items-center gap-sm mb-lg p-sm rounded-lg hover:bg-surface-variant transition-colors duration-200 cursor-pointer">
        <img alt="Dr. Nan profile picture" class="w-10 h-10 rounded-full object-cover border border-surface-variant" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCW2PYUEA3gek5AJPO192PVgT89p676egbhhrsDEXpvwkXGCLgOv9kZ_PsM1LGlBAXqrqhC5HiwAj5gxZngu_REJlplwoPOlNtjvNebpPUL5bF0q4B9LA-NlV6vNlYubGE6-t2NHg1Rsb7LUMbhowd2EjHRXcc7xKn6R6VFniefIoAOyYP90jqS9j42QD79hgyT54mwQW63qOsAfCtZviERyy42KcN3Q0e5MeX8Jv00VouzRfKU_a6OZHFYBvGPYSwNtpi4uDOlY9IY"/>
        <div>
          <div class="font-label-caps text-label-caps text-on-surface">Dr. Nan</div>
          <div class="font-body-md text-body-md text-on-surface-variant text-xs">นักระบาดวิทยาภูมิภาค</div>
        </div>
      </div>

      <!-- CTA Button for simulation pinger -->
      <button @click="triggerLivePing" class="w-full bg-primary text-on-primary py-sm px-md rounded-lg font-label-caps text-label-caps flex items-center justify-center gap-xs mb-lg hover:opacity-90 transition-opacity">
        <span class="material-symbols-outlined text-on-primary" style="font-size: 18px;">add</span>
        จำลองนัดหมายใหม่
      </button>

      <!-- Navigation links -->
      <nav class="flex-1 flex flex-col gap-sm">
        <NuxtLink to="/" class="flex items-center gap-sm p-sm rounded-lg text-on-surface-variant hover:bg-surface-variant transition-colors duration-200" active-class="text-primary font-bold border-r-4 border-primary bg-surface-variant">
          <span class="material-symbols-outlined text-inherit" style="font-size: 20px;">dashboard</span>
          <span class="font-label-caps text-label-caps">แผงควบคุม</span>
        </NuxtLink>
        
        <NuxtLink to="/explorer" class="flex items-center gap-sm p-sm rounded-lg text-on-surface-variant hover:bg-surface-variant transition-colors duration-200" active-class="text-primary font-bold border-r-4 border-primary bg-surface-variant">
          <span class="material-symbols-outlined text-inherit" style="font-size: 20px;">database</span>
          <span class="font-label-caps text-label-caps">รายการเคส</span>
        </NuxtLink>
      </nav>

      <!-- Footer menu links -->
      <div class="mt-auto pt-lg border-t border-surface-variant flex flex-col gap-sm">
        <a class="flex items-center gap-sm p-sm rounded-lg text-on-surface-variant hover:bg-surface-variant transition-colors duration-200" href="#">
          <span class="material-symbols-outlined text-on-surface-variant" style="font-size: 20px;">settings</span>
          <span class="font-label-caps text-label-caps">ตั้งค่า</span>
        </a>
        <a class="flex items-center gap-sm p-sm rounded-lg text-on-surface-variant hover:bg-surface-variant transition-colors duration-200" href="#">
          <span class="material-symbols-outlined text-on-surface-variant" style="font-size: 20px;">help</span>
          <span class="font-label-caps text-label-caps">สนับสนุน</span>
        </a>
      </div>
    </aside>

    <!-- Right-side Workspace -->
    <div class="ml-64 flex-1 flex flex-col w-[calc(100%-16rem)]">
      <!-- TopNavBar -->
      <header class="bg-surface-bright flex justify-between items-center w-full px-lg py-md sticky top-0 z-30 border-b border-surface-variant">
        <div class="flex items-center gap-md w-1/3">
          <div class="relative w-full max-w-md">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline" style="font-size: 20px;">search</span>
            <input @keyup.enter="handleSearchRedirect" v-model="globalSearch" class="w-full bg-surface-container-low border border-surface-variant rounded-full py-2 pl-10 pr-4 text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="ค้นหาบันทึก หรือจังหวัด..." type="text"/>
          </div>
        </div>
        
        <div class="flex items-center gap-sm">
          <button class="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-all duration-200 relative">
            <span class="material-symbols-outlined" style="font-size: 24px;">notifications</span>
            <span class="absolute top-2 right-2 w-2 h-2 bg-error rounded-full" v-if="toastActive"></span>
          </button>
          <button class="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-all duration-200 relative">
            <span class="material-symbols-outlined" style="font-size: 24px;">smart_toy</span>
          </button>
          <button class="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-all duration-200 relative">
            <span class="material-symbols-outlined" style="font-size: 24px;">account_circle</span>
          </button>
        </div>
      </header>

      <!-- Main Content Area Router -->
      <main class="p-margin pt-lg pb-xl bg-background flex-1">
        <NuxtPage />
      </main>
    </div>

    <!-- Real-time Ping Alert Toast (F6) -->
    <div class="fixed top-24 right-6 z-50 transition-all duration-300 transform" :class="toastActive ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0 pointer-events-none'">
      <div class="bg-surface-container-lowest border border-secondary/40 shadow-xl rounded-xl p-md flex items-center gap-md min-w-[340px]">
        <div class="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
          <span class="material-symbols-outlined text-[18px]" style="font-variation-settings: 'FILL' 1;">cell_tower</span>
        </div>
        <div>
          <div class="font-label-caps text-label-caps text-secondary mb-0.5">🔔 ตรวจพบเคสใหม่ (Live Ping)</div>
          <div class="font-body-md text-body-md text-on-surface font-medium text-xs">{{ toastMessage }}</div>
        </div>
        <button @click="toastActive = false" class="ml-auto text-outline hover:text-on-surface text-lg">×</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useState, useRouter } from '#app';

const router = useRouter();

const globalSearch = ref('');
const toastActive = ref(false);
const toastMessage = ref('');

// Global shared state for city blinking map pins
const activePingCity = useState('active-ping-city', () => '');

// Search redirect action
function handleSearchRedirect() {
  if (globalSearch.value.trim()) {
    router.push({
      path: '/explorer',
      query: { search: globalSearch.value }
    });
    globalSearch.value = '';
  }
}

// Live simulation databases
const patientNames = ['สมชาย ใจงาม', 'อารียา สินทวี', 'วิชัย รัตนกร', 'นารี รักไทย', 'ธนา วงศ์สุวรรณ', 'พิมพิศา เรืองเดช'];
const mockSymptoms = ['Flu symptoms', 'Food Poisoning', 'Dengue Fever', 'Covid-19', 'Diarrhea'];
const mockCities = ['Chiang Mai', 'Phuket', 'Bangkok', 'Khon Kaen', 'Chon Buri'];

function triggerLivePing() {
  const name = patientNames[Math.floor(Math.random() * patientNames.length)];
  const symptom = mockSymptoms[Math.floor(Math.random() * mockSymptoms.length)];
  const city = mockCities[Math.floor(Math.random() * mockCities.length)];

  toastMessage.value = `คุณ ${name} อาการ "${symptom}" พิกัด ${city}`;
  toastActive.value = true;
  activePingCity.value = city;

  setTimeout(() => {
    toastActive.value = false;
  }, 6500);

  setTimeout(() => {
    activePingCity.value = '';
  }, 5000);
}

onMounted(() => {
  setTimeout(() => {
    triggerLivePing();
    setInterval(triggerLivePing, 22000);
  }, 10000);
});
</script>

<style>
@import '~/assets/css/app.css';
</style>
