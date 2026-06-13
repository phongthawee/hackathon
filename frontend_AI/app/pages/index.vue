<template>
  <div class="dashboard-page">
    <header class="dashboard-header">
      <div>
        <h1 class="page-title">Surveillance Control Center</h1>
        <p class="page-subtitle">แดชบอร์ดเฝ้าระวังโรคระบาดและวิเคราะห์สถานการณ์สาธารณสุขสด</p>
      </div>
      
      <!-- Date stamp -->
      <div class="date-badge glass-panel">
        📅 วันเสาร์ที่ 13 มิถุนายน 2026
      </div>
    </header>

    <!-- 1. KPI Cards Row -->
    <div class="kpi-grid">
      <!-- Total cases -->
      <div class="kpi-card glass-panel">
        <div class="kpi-label">เคสรวมในระบบ</div>
        <div class="kpi-value cyan-glow">{{ kpis.totalCases || 0 }}</div>
        <div class="kpi-trend green-text">สะสมย้อนหลัง 90 วัน</div>
      </div>
      
      <!-- Alert level -->
      <div class="kpi-card glass-panel" :class="'level-' + kpis.alertLevel">
        <div class="kpi-label">ระดับเตือนภัยปัจจุบัน</div>
        <div class="kpi-value alert-text">
          ⚠️ {{ getAlertText(kpis.alertLevel) }}
        </div>
        <div class="kpi-trend">อิงจากความเร็วการระบาดสัปดาห์นี้</div>
      </div>
      
      <!-- Top Symptom -->
      <div class="kpi-card glass-panel">
        <div class="kpi-label">กลุ่มอาการระบาดมาแรง</div>
        <div class="kpi-value yellow-glow font-thai">{{ kpis.topSymptom || 'Loading...' }}</div>
        <div class="kpi-trend">พุ่งสูงในสัปดาห์ล่าสุด</div>
      </div>
      
      <!-- No-show rate -->
      <div class="kpi-card glass-panel">
        <div class="kpi-label">อัตรา NO-SHOW คลินิก</div>
        <div class="kpi-value red-glow">{{ kpis.noShowRate || 0 }}%</div>
        <div class="kpi-trend">มีนัดไม่เข้าพบแพทย์สะสม</div>
      </div>
    </div>

    <!-- 2. Main Visual Panel (Map + Charts + AI) -->
    <div class="visual-panel-grid">
      
      <!-- Left side: Map and charts -->
      <div class="left-col">
        <!-- Outbreak Map -->
        <ThailandMap 
          :hotspots="hotspots" 
          :active-ping-city="activePingCity"
          @select-city="handleSelectCity" />
        
        <!-- SVG Charts -->
        <SymptomChart :trend="trend" :top-symptoms="topSymptoms" />
      </div>

      <!-- Right side: AI Analyst and Province Drawer -->
      <div class="right-col">
        <!-- Province Detail slideout panel (embedded in UI layout) -->
        <div v-if="selectedCityData" class="detail-panel glass-panel">
          <div class="panel-header">
            <h3>📊 คลัสเตอร์ระบาด: {{ selectedCityData.city }}</h3>
            <button class="close-btn" @click="selectedCityData = null">×</button>
          </div>
          <div class="panel-body">
            <div class="stat-row">
              <span class="lbl">ยอดเคสทั้งหมด:</span>
              <span class="val bold">{{ selectedCityData.totalCases }} ราย</span>
            </div>
            <div class="stat-row">
              <span class="lbl">กำลังรักษา/รอดำเนินการ:</span>
              <span class="val bold yellow-text">{{ selectedCityData.activeCases }} ราย</span>
            </div>
            <div class="stat-row">
              <span class="lbl">ประเมินความรุนแรง:</span>
              <span class="badge" :class="'badge-' + selectedCityData.severity">
                {{ selectedCityData.severity === 'high' ? 'วิกฤต/ระบาดหนัก' : selectedCityData.severity === 'medium' ? 'ปานกลาง' : 'ต่ำ' }}
              </span>
            </div>
            
            <div class="symptom-breakdown">
              <h5>กลุ่มอาการพบบ่อยที่สุด:</h5>
              <ul>
                <li v-for="(symptom, idx) in selectedCityData.topSymptoms" :key="idx">
                  🔹 {{ symptom }}
                </li>
              </ul>
            </div>
            
            <button class="investigate-btn" @click="investigateCity(selectedCityData.city)">
              🔎 เจาะลึกเคสในเมืองนี้
            </button>
          </div>
        </div>

        <!-- AI Analyst Card -->
        <div class="ai-analyst-panel glass-panel">
          <div class="panel-header-ai">
            <div class="ai-title-row">
              <span class="ai-icon">🤖</span>
              <div>
                <h3>AI Outbreak Analyst</h3>
                <span class="sub">Powered by Gemini 1.5 Flash</span>
              </div>
            </div>
          </div>
          
          <div class="ai-body">
            <!-- Auto summary section -->
            <div class="auto-summary-box">
              <p v-if="loadingSummary" class="loading-pulse">🔄 กำลังประมวลผลข้อมูลสาธารณสุขและสร้างบทสรุป...</p>
              <p v-else class="summary-text">{{ autoSummary }}</p>
            </div>

            <!-- Chat message logs -->
            <div class="chat-logs" ref="chatLogsRef">
              <div v-for="(msg, idx) in chatHistory" :key="idx" class="chat-bubble" :class="msg.role">
                <span class="bubble-sender">{{ msg.role === 'user' ? 'คุณหมอแนน' : 'Analyst 🤖' }}</span>
                <p class="bubble-text" v-html="formatMarkdown(msg.text)"></p>
              </div>
              <div v-if="loadingChat" class="chat-bubble analyst loading">
                <span class="bubble-sender">Analyst 🤖</span>
                <p class="bubble-text loading-dots">กำลังประมวลผลคำตอบ<span>.</span><span>.</span><span>.</span></p>
              </div>
            </div>
          </div>

          <!-- Chat Input -->
          <form class="ai-input-area" @submit.prevent="sendAiMessage">
            <input 
              v-model="aiQuery" 
              type="text" 
              placeholder="ถาม AI เช่น 'เดือนนี้เชียงใหม่อาการไหนน่าห่วงสุด?'" 
              :disabled="loadingChat" />
            <button type="submit" :disabled="loadingChat || !aiQuery.trim()">
              ส่ง ⚡
            </button>
          </form>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useState } from '#app';
import ThailandMap from '~/components/ThailandMap.vue';
import SymptomChart from '~/components/SymptomChart.vue';

const router = useRouter();

// API data states
const kpis = ref({});
const hotspots = ref([]);
const trend = ref([]);
const topSymptoms = ref([]);

// UI states
const selectedCityData = ref(null);
const aiQuery = ref('');
const autoSummary = ref('');
const loadingSummary = ref(true);
const loadingChat = ref(false);
const chatHistory = ref([]);
const chatLogsRef = ref(null);

// Get global real-time ping indicator
const activePingCity = useState('active-ping-city');

// Dynamic alert text helper
function getAlertText(level) {
  if (level === 'RED') return 'ระดับวิกฤต (แดง)';
  if (level === 'YELLOW') return 'ระดับเฝ้าระวัง (เหลือง)';
  return 'ระดับปกติ (เขียว)';
}

// Fetch aggregate dashboard statistics
async function fetchStats() {
  try {
    const data = await $fetch('/api/stats');
    if (data.success) {
      kpis.value = data.kpis;
      hotspots.value = data.hotspots;
      trend.value = data.trend;
      topSymptoms.value = data.topSymptoms;
      
      // If a city was selected, sync its stats too
      if (selectedCityData.value) {
        const updated = data.hotspots.find(h => h.city === selectedCityData.value.city);
        if (updated) selectedCityData.value = updated;
      }
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Fetch initial auto-summary from Gemini on load
async function fetchAutoSummary() {
  loadingSummary.value = true;
  try {
    const data = await $fetch('/api/analyst', {
      method: 'POST',
      body: { isAutoSummary: true }
    });
    autoSummary.value = data.response;
  } catch (error) {
    autoSummary.value = 'ไม่สามารถดึงข้อมูลสรุปอัตโนมัติได้ในขณะนี้';
  } finally {
    loadingSummary.value = false;
  }
}

// Handle Map Pin Click
function handleSelectCity(cityData) {
  selectedCityData.value = cityData;
}

// Deep investigate city -> Redirect to explorer page with search filters
function investigateCity(cityName) {
  router.push({
    path: '/explorer',
    query: { city: cityName }
  });
}

// Chat integration with Gemini API
async function sendAiMessage() {
  if (!aiQuery.value.trim() || loadingChat.value) return;

  const query = aiQuery.value;
  chatHistory.value.push({ role: 'user', text: query });
  aiQuery.value = '';
  loadingChat.value = true;
  
  // Scroll to bottom
  scrollToBottom();

  try {
    const data = await $fetch('/api/analyst', {
      method: 'POST',
      body: { message: query }
    });
    chatHistory.value.push({ role: 'analyst', text: data.response });
  } catch (err) {
    chatHistory.value.push({ 
      role: 'analyst', 
      text: 'ขออภัยครับ เกิดข้อผิดพลาดทางเทคนิคในการเชื่อมต่อระบบวิเคราะห์ AI' 
    });
  } finally {
    loadingChat.value = false;
    scrollToBottom();
  }
}

// Scroll chat panel to bottom
function scrollToBottom() {
  setTimeout(() => {
    if (chatLogsRef.value) {
      chatLogsRef.value.scrollTop = chatLogsRef.value.scrollHeight;
    }
  }, 100);
}

// Simple parser to format markdown responses from Gemini
function formatMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="chat-code">$1</code>')
    .replace(/\n/g, '<br />');
}

// Watch global pings. When a case pings, fetch stats to update counts dynamically!
watch(activePingCity, (newCity) => {
  if (newCity) {
    console.log(`Real-time ping received for ${newCity}. Refreshing stats.`);
    fetchStats();
  }
});

onMounted(() => {
  fetchStats();
  fetchAutoSummary();
});
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-family: var(--font-title);
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  background: linear-gradient(to right, #ffffff, #9ca3af);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-subtitle {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

.date-badge {
  padding: 8px 16px;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.02);
}

/* KPI Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.kpi-card {
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.kpi-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: var(--text-muted);
}

.kpi-card.cyan-glow::before, .cyan-glow {
  background: var(--color-blue);
  color: #06b6d4;
  text-shadow: 0 0 10px rgba(6, 182, 212, 0.4);
}

.kpi-card:nth-child(1)::before { background: var(--color-blue); }
.kpi-card:nth-child(2)::before { background: var(--color-yellow); }
.kpi-card:nth-child(3)::before { background: var(--color-green); }
.kpi-card:nth-child(4)::before { background: var(--color-red); }

.kpi-card.level-RED::before {
  background: var(--color-red);
}

.kpi-card.level-YELLOW::before {
  background: var(--color-yellow);
}

.level-YELLOW .alert-text {
  color: var(--color-yellow);
  text-shadow: 0 0 10px rgba(245, 158, 11, 0.4);
}

.level-RED .alert-text {
  color: var(--color-red);
  text-shadow: 0 0 10px rgba(239, 68, 68, 0.4);
}

.font-thai {
  font-family: var(--font-title);
  font-weight: 700;
}

.kpi-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  font-weight: 600;
}

.kpi-value {
  font-family: var(--font-title);
  font-size: 1.85rem;
  font-weight: 800;
  margin-top: 10px;
  margin-bottom: 6px;
  letter-spacing: -0.02em;
}

.kpi-trend {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.green-text {
  color: var(--color-green);
}

.yellow-glow {
  color: var(--color-yellow);
  text-shadow: 0 0 10px rgba(245, 158, 11, 0.3);
}

.red-glow {
  color: var(--color-red);
  text-shadow: 0 0 10px rgba(239, 68, 68, 0.3);
}

/* Visual Panel Layout */
.visual-panel-grid {
  display: grid;
  grid-template-columns: 1.7fr 1.3fr;
  gap: 24px;
  align-items: start;
}

.left-col {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.right-col {
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: sticky;
  top: 40px;
}

/* Detail slideout inside UI */
.detail-panel {
  padding: 24px;
  border-color: rgba(6, 182, 212, 0.3);
  box-shadow: 0 8px 32px 0 rgba(6, 182, 212, 0.1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.panel-header h3 {
  font-family: var(--font-title);
  font-size: 1.15rem;
  font-weight: 700;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
}

.panel-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  border-bottom: 1px solid rgba(255,255,255,0.03);
  padding-bottom: 8px;
}

.bold {
  font-weight: 700;
}

.yellow-text {
  color: var(--color-yellow);
}

.badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
}

.badge-high {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.badge-medium {
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #f59e0b;
}

.badge-low {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #10b981;
}

.symptom-breakdown {
  margin-top: 8px;
  background: rgba(255,255,255,0.02);
  padding: 12px;
  border-radius: 8px;
}

.symptom-breakdown h5 {
  font-size: 0.8rem;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.symptom-breakdown ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.investigate-btn {
  margin-top: 12px;
  background: rgba(6, 182, 212, 0.12);
  border: 1px solid rgba(6, 182, 212, 0.3);
  color: #22d3ee;
  padding: 10px;
  border-radius: 8px;
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.investigate-btn:hover {
  background: var(--color-blue);
  color: #ffffff;
}

/* AI Analyst Card */
.ai-analyst-panel {
  display: flex;
  flex-direction: column;
  height: 520px;
}

.panel-header-ai {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-glow);
}

.ai-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-icon {
  font-size: 1.5rem;
}

.ai-title-row h3 {
  font-family: var(--font-title);
  font-size: 1.1rem;
  font-weight: 700;
}

.ai-title-row .sub {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.ai-body {
  flex-grow: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.auto-summary-box {
  background: rgba(6, 182, 212, 0.05);
  border-left: 3px solid var(--color-blue);
  padding: 12px 16px;
  border-radius: 0 8px 8px 0;
}

.summary-text {
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--text-primary);
}

.chat-logs {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chat-bubble {
  display: flex;
  flex-direction: column;
  max-width: 85%;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 0.8rem;
  line-height: 1.5;
}

.chat-bubble.user {
  align-self: flex-end;
  background: rgba(6, 182, 212, 0.12);
  border: 1px solid rgba(6, 182, 212, 0.2);
  border-bottom-right-radius: 2px;
}

.chat-bubble.analyst {
  align-self: flex-start;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-bottom-left-radius: 2px;
}

.bubble-sender {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--text-muted);
  margin-bottom: 4px;
}

/* Chat Input field */
.ai-input-area {
  display: flex;
  border-top: 1px solid var(--border-glow);
  padding: 12px 16px;
  background: rgba(13, 14, 20, 0.5);
  border-radius: 0 0 16px 16px;
}

.ai-input-area input {
  flex-grow: 1;
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 0.8rem;
  padding: 8px 12px;
}

.ai-input-area input:focus {
  outline: none;
}

.ai-input-area button {
  background: var(--color-blue);
  border: none;
  color: #ffffff;
  padding: 8px 16px;
  border-radius: 8px;
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
  transition: opacity 0.2s;
}

.ai-input-area button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* CSS Loaders */
.loading-pulse {
  font-size: 0.8rem;
  color: var(--text-secondary);
  animation: pulse-op 1.5s infinite alternate;
}

@keyframes pulse-op {
  0% { opacity: 0.5; }
  100% { opacity: 1; }
}

.loading-dots span {
  animation: blink 1.4s infinite both;
}
.loading-dots span:nth-child(2) { animation-delay: .2s; }
.loading-dots span:nth-child(3) { animation-delay: .4s; }

@keyframes blink {
  0% { opacity: .2; }
  20% { opacity: 1; }
  100% { opacity: .2; }
}
</style>
