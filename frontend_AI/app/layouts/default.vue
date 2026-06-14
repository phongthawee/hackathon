<template>
  <div
    class="flex min-h-screen w-full bg-background text-on-background font-body-md antialiased overflow-x-hidden"
  >
    <!-- Mobile Backdrop Overlay -->
    <div
      v-if="isMobileOpen"
      @click="isMobileOpen = false"
      class="lg:hidden fixed inset-0 bg-black/40 z-40 transition-opacity duration-300"
    ></div>

    <!-- Floating Hamburger Button on Mobile Map View -->
    <button
      v-if="route.path === '/map'"
      @click="isMobileOpen = true"
      class="lg:hidden fixed top-4 left-4 z-40 w-10 h-10 rounded-full bg-surface-container shadow-md border border-surface-variant flex items-center justify-center text-on-surface-variant"
    >
      <span class="material-symbols-outlined">menu</span>
    </button>

    <!-- SideNavBar -->
    <aside
      class="bg-surface dark:bg-inverse-surface shadow-sm h-screen fixed left-0 top-0 z-50 border-r border-surface-variant flex flex-col h-full py-lg transition-all duration-300 ease-in-out"
      :class="[
        isMobileOpen
          ? 'translate-x-0 w-64 px-md'
          : '-translate-x-full lg:translate-x-0',
        isCollapsed ? 'lg:w-20 lg:px-sm' : 'lg:w-64 lg:px-md',
      ]"
    >
      <!-- Logo Identity -->
      <div class="mb-xl px-sm flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 overflow-hidden">
          <span
            class="material-symbols-outlined text-primary text-[32px] flex-shrink-0"
            >radar</span
          >
          <span
            v-show="!isCollapsed"
            class="font-display-lg text-display-lg font-bold text-primary dark:text-inverse-primary tracking-tight transition-all duration-300"
            >Health Radar</span
          >
        </div>
        <!-- Collapse Trigger for Desktop -->
        <button
          @click="isCollapsed = !isCollapsed"
          class="hidden lg:flex w-8 h-8 rounded-full items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-all flex-shrink-0"
        >
          <span class="material-symbols-outlined text-sm">{{
            isCollapsed ? "chevron_right" : "chevron_left"
          }}</span>
        </button>
        <!-- Close button for Mobile drawer -->
        <button
          @click="isMobileOpen = false"
          class="lg:hidden w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant flex-shrink-0"
        >
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <!-- User Profile Card -->
      <div
        class="flex items-center gap-md mb-xl p-sm rounded-lg hover:bg-surface-variant transition-colors duration-200 cursor-pointer border border-transparent hover:border-outline-variant justify-center lg:justify-start"
        :class="{ 'lg:px-2': isCollapsed }"
      >
        <img
          alt="Dr. Nan profile picture"
          class="w-10 h-10 rounded-full object-cover shadow-sm border border-surface-variant flex-shrink-0"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCW2PYUEA3gek5AJPO192PVgT89p676egbhhrsDEXpvwkXGCLgOv9kZ_PsM1LGlBAXqrqhC5HiwAj5gxZngu_REJlplwoPOlNtjvNebpPUL5bF0q4B9LA-NlV6vNlYubGE6-t2NHg1Rsb7LUMbhowd2EjHRXcc7xKn6R6VFniefIoAOyYP90jqS9j42QD79hgyT54mwQW63qOsAfCtZviERyy42KcN3Q0e5MeX8Jv00VouzRfKU_a6OZHFYBvGPYSwNtpi4uDOlY9IY"
        />
        <div v-show="!isCollapsed" class="flex flex-col overflow-hidden">
          <span
            class="font-headline-sm text-body-lg font-semibold text-on-surface truncate"
            >Dr. Nan</span
          >
          <span
            class="font-body-md text-label-caps text-on-surface-variant truncate"
            >Regional Epidemiologist</span
          >
        </div>
      </div>

      <!-- CTA Button for simulation pinger -->
      <button
        @click="triggerLivePing"
        class="w-full bg-primary text-on-primary py-sm rounded-lg font-label-caps text-label-caps flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-sm mb-lg px-2 lg:px-md"
        :title="isCollapsed ? 'New Alert' : ''"
      >
        <span class="material-symbols-outlined text-[18px] flex-shrink-0"
          >add_alert</span
        >
        <span v-show="!isCollapsed">New Alert</span>
      </button>

      <!-- Navigation links -->
      <nav class="flex-grow space-y-sm flex flex-col">
        <!-- Dashboard -->
        <NuxtLink
          to="/"
          class="flex items-center gap-md py-sm rounded-md font-body-md text-body-md transition-colors duration-200 hover:bg-surface-variant text-on-surface-variant justify-center lg:justify-start px-2 lg:px-sm"
          active-class="text-primary font-bold border-r-4 border-primary bg-primary-container/5"
          :title="isCollapsed ? 'Dashboard' : ''"
          exact
        >
          <span class="material-symbols-outlined text-[20px] flex-shrink-0"
            >dashboard</span
          >
          <span v-show="!isCollapsed" class="truncate">Dashboard</span>
        </NuxtLink>

        <!-- Live Map -->
        <NuxtLink
          to="/map"
          class="flex items-center gap-md py-sm rounded-md font-body-md text-body-md transition-colors duration-200 hover:bg-surface-variant text-on-surface-variant justify-center lg:justify-start px-2 lg:px-sm"
          active-class="text-primary font-bold border-r-4 border-primary bg-primary-container/5"
          :title="isCollapsed ? 'Live Map' : ''"
        >
          <span class="material-symbols-outlined text-[20px] flex-shrink-0"
            >map</span
          >
          <span v-show="!isCollapsed" class="truncate">Live Map</span>
        </NuxtLink>

        <!-- Outbreak Risk Map -->
        <NuxtLink
          to="/outbreaks"
          class="flex items-center gap-md py-sm rounded-md font-body-md text-body-md transition-colors duration-200 hover:bg-surface-variant text-on-surface-variant justify-center lg:justify-start px-2 lg:px-sm"
          active-class="text-primary font-bold border-r-4 border-primary bg-primary-container/5"
          :title="isCollapsed ? 'Outbreak Risk Map' : ''"
        >
          <span class="material-symbols-outlined text-[20px] flex-shrink-0"
            >spatial_tracking</span
          >
          <span v-show="!isCollapsed" class="truncate">Outbreak Risk Map</span>
        </NuxtLink>

        <!-- Case Explorer -->
        <NuxtLink
          to="/explorer"
          class="flex items-center gap-md py-sm rounded-md font-body-md text-body-md transition-colors duration-200 hover:bg-surface-variant text-on-surface-variant justify-center lg:justify-start px-2 lg:px-sm"
          active-class="text-primary font-bold border-r-4 border-primary bg-primary-container/5"
          :title="isCollapsed ? 'Case Explorer' : ''"
        >
          <span class="material-symbols-outlined text-[20px] flex-shrink-0"
            >database</span
          >
          <span v-show="!isCollapsed" class="truncate">Case Explorer</span>
        </NuxtLink>

        <!-- Reports -->
        <a
          class="flex items-center gap-md py-sm rounded-md font-body-md text-body-md transition-colors duration-200 hover:bg-surface-variant text-on-surface-variant cursor-not-allowed opacity-60 justify-center lg:justify-start px-2 lg:px-sm"
          href="#"
          :title="isCollapsed ? 'Reports' : ''"
        >
          <span class="material-symbols-outlined text-[20px] flex-shrink-0"
            >description</span
          >
          <span v-show="!isCollapsed" class="truncate">Reports</span>
        </a>
      </nav>

      <!-- Footer menu links -->
      <div
        class="mt-auto pt-lg border-t border-surface-container flex flex-col gap-sm"
      >
        <a
          class="flex items-center gap-md py-xs rounded-md font-body-md text-body-md text-on-surface-variant hover:bg-surface-variant transition-colors justify-center lg:justify-start px-2 lg:px-sm"
          href="#"
          :title="isCollapsed ? 'Settings' : ''"
        >
          <span class="material-symbols-outlined text-[18px] flex-shrink-0"
            >settings</span
          >
          <span v-show="!isCollapsed" class="truncate">Settings</span>
        </a>
        <a
          class="flex items-center gap-md py-xs rounded-md font-body-md text-body-md text-on-surface-variant hover:bg-surface-variant transition-colors justify-center lg:justify-start px-2 lg:px-sm"
          href="#"
          :title="isCollapsed ? 'Support' : ''"
        >
          <span class="material-symbols-outlined text-[18px] flex-shrink-0"
            >help</span
          >
          <span v-show="!isCollapsed" class="truncate">Support</span>
        </a>
      </div>
    </aside>

    <!-- Right-side Workspace -->
    <div
      class="flex-grow flex flex-col min-h-screen transition-all duration-300 ease-in-out w-full"
      :class="[
        isCollapsed
          ? 'lg:ml-20 lg:w-[calc(100%-5rem)]'
          : 'lg:ml-64 lg:w-[calc(100%-16rem)]',
        'ml-0 w-full',
      ]"
    >
      <!-- TopNavBar -->
      <header
        v-if="route.path !== '/map'"
        class="bg-surface-bright flex justify-between items-center w-full px-lg py-md sticky top-0 z-30 border-b border-surface-variant"
      >
        <div class="flex items-center gap-md w-full lg:w-1/3">
          <!-- Hamburger Menu (Mobile/Tablet) -->
          <button
            @click="isMobileOpen = true"
            class="lg:hidden w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-all flex-shrink-0"
          >
            <span class="material-symbols-outlined">menu</span>
          </button>

          <div class="relative w-full max-w-md">
            <span
              class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline"
              style="font-size: 20px"
              >search</span
            >
            <input
              @keyup.enter="handleSearchRedirect"
              v-model="globalSearch"
              class="w-full bg-surface-container-low border border-surface-variant rounded-full py-2 pl-10 pr-4 text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="ค้นหาทั่วโลก..."
              type="text"
            />
          </div>
        </div>

        <div class="flex items-center gap-sm">
          <button
            class="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-all duration-200 relative"
          >
            <span class="material-symbols-outlined" style="font-size: 24px"
              >notifications</span
            >
            <span
              class="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"
              v-if="toastActive"
            ></span>
          </button>
          <button
            class="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-all duration-200 relative"
          >
            <span class="material-symbols-outlined" style="font-size: 24px"
              >smart_toy</span
            >
          </button>
          <button
            class="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-all duration-200 relative"
          >
            <span class="material-symbols-outlined" style="font-size: 24px"
              >account_circle</span
            >
          </button>
        </div>
      </header>

      <!-- Main Content Area Router -->
      <main
        :class="
          route.path === '/map' || route.path === '/outbreaks'
            ? 'flex-1 bg-background flex flex-col relative overflow-hidden h-screen w-full'
            : 'p-margin pt-lg pb-xl bg-background flex-1'
        "
      >
        <slot />
      </main>
    </div>

    <!-- Real-time Ping Alert Toast (F6) -->
    <div
      class="fixed top-24 right-6 z-50 transition-all duration-300 transform"
      :class="
        toastActive
          ? 'translate-x-0 opacity-100'
          : 'translate-x-12 opacity-0 pointer-events-none'
      "
    >
      <div
        class="bg-surface-container-lowest border border-secondary/40 shadow-xl rounded-xl p-md flex items-center gap-md min-w-[340px]"
      >
        <div
          class="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center"
        >
          <!-- <span
            class="material-symbols-outlined text-[18px]"
            style="font-variation-settings: &quot;FILL&quot; 1"
            >cell_tower</span
          > -->
        </div>
        <div>
          <div class="font-label-caps text-label-caps text-secondary mb-0.5">
            🔔 ตรวจพบเคสใหม่ (Live Ping)
          </div>
          <div
            class="font-body-md text-body-md text-on-surface font-medium text-xs"
          >
            {{ toastMessage }}
          </div>
        </div>
        <button
          @click="toastActive = false"
          class="ml-auto text-outline hover:text-on-surface text-lg"
        >
          ×
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useState, useRouter, useRoute } from "#app";

const router = useRouter();
const route = useRoute();

const globalSearch = ref("");
const toastActive = ref(false);
const toastMessage = ref("");

// Sidebar state controls
const isCollapsed = ref(false);
const isMobileOpen = ref(false);

// Global shared state for city blinking map pins
const activePingCity = useState("active-ping-city", () => "");

// Search redirect action
function handleSearchRedirect() {
  if (globalSearch.value.trim()) {
    router.push({
      path: "/explorer",
      query: { search: globalSearch.value },
    });
    globalSearch.value = "";
  }
}

// Live simulation databases
const patientNames = [
  "สมชาย ใจงาม",
  "อารียา สินทวี",
  "วิชัย รัตนกร",
  "นารี รักไทย",
  "ธนา วงศ์สุวรรณ",
  "พิมพิศา เรืองเดช",
];
const mockSymptoms = [
  "ไข้หวัดใหญ่",
  "อาหารเป็นพิษ",
  "ไข้เลือดออก",
  "โควิด-19",
  "ท้องร่วง",
];
const mockCities = ["เชียงใหม่", "ภูเก็ต", "กรุงเทพฯ", "ขอนแก่น", "ชลบุรี"];

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
    activePingCity.value = "";
  }, 5000);
}

onMounted(() => {
  setTimeout(() => {
    triggerLivePing();
    setInterval(triggerLivePing, 22000);
  }, 10000);
});
</script>
