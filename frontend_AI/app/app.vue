<template>
  <div class="app-container">
    <!-- Sidebar Navigation -->
    <aside class="sidebar">
      <div>
        <div class="sidebar-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="url(#logoGrad)" />
            <defs>
              <linearGradient id="logoGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#06b6d4" />
                <stop offset="100%" stop-color="#10b981" />
              </linearGradient>
            </defs>
          </svg>
          Health Radar
        </div>
        
        <nav class="nav-links">
          <NuxtLink to="/" class="nav-item" active-class="active" exact>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="9" />
              <rect x="14" y="3" width="7" height="5" />
              <rect x="14" y="12" width="7" height="9" />
              <rect x="3" y="16" width="7" height="5" />
            </svg>
            Surveillance Overview
          </NuxtLink>
          
          <NuxtLink to="/explorer" class="nav-item" active-class="active">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Case Explorer
          </NuxtLink>
        </nav>
      </div>
      
      <!-- User Persona Panel in Sidebar footer -->
      <div class="user-panel glass-panel">
        <div class="avatar">🛡️</div>
        <div>
          <p class="user-name">คุณหมอแนน</p>
          <p class="user-role">นักระบาดวิทยา (หลัก)</p>
        </div>
      </div>
    </aside>

    <!-- Main Viewport Router -->
    <main class="main-content">
      <NuxtPage />
    </main>

    <!-- Real-time Ping Toast Notification (F6) -->
    <div class="toast-container">
      <div class="toast" :class="{ active: toastActive }">
        <span class="toast-icon"></span>
        <div class="toast-body">
          <p class="toast-title">🔔 ตรวจพบเคสใหม่ (Real-time Ping)</p>
          <p class="toast-text">{{ toastMessage }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useState } from '#app';

const toastActive = ref(false);
const toastMessage = ref('');

// Global state to trigger map pins animations
const activePingCity = useState('active-ping-city', () => '');

// Simulated case templates for the real-time feed
const patientNames = ['สมชาย ใจงาม', 'อารียา สินทวี', 'วิชัย รัตนกร', 'นารี รักไทย', 'ธนา วงศ์สุวรรณ', 'พิมพิศา เรืองเดช'];
const mockSymptoms = ['Flu symptoms', 'Food Poisoning', 'Dengue Fever', 'Covid-19', 'Diarrhea'];
const mockCities = ['Chiang Mai', 'Phuket', 'Bangkok', 'Khon Kaen', 'Chon Buri'];

function triggerLivePing() {
  const name = patientNames[Math.floor(Math.random() * patientNames.length)];
  const symptom = mockSymptoms[Math.floor(Math.random() * mockSymptoms.length)];
  const city = mockCities[Math.floor(Math.random() * mockCities.length)];

  // Formulate Toast message
  toastMessage.value = `คุณ ${name} มีอาการ "${symptom}" เข้ารับการรักษาพิกัด ${city}`;
  toastActive.value = true;
  
  // Set global state to blink map
  activePingCity.value = city;

  // Clear toast and map blink after a few seconds
  setTimeout(() => {
    toastActive.value = false;
  }, 5000);

  setTimeout(() => {
    activePingCity.value = '';
  }, 4000);
}

onMounted(() => {
  // Start simulation loop after 10 seconds of app load
  setTimeout(() => {
    triggerLivePing();
    setInterval(triggerLivePing, 22000); // Trigger every 22 seconds
  }, 10000);
});
</script>

<style>
/* Load Global CSS Custom Properties */
@import '~/assets/css/app.css';

.user-panel {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  margin-top: auto;
  border-radius: 12px;
  border-color: rgba(255, 255, 255, 0.04);
}

.avatar {
  font-size: 1.25rem;
  background: rgba(255, 255, 255, 0.05);
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
}

.user-role {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.toast-body {
  display: flex;
  flex-direction: column;
}

.toast-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
}

.toast-text {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 2px;
}
</style>
