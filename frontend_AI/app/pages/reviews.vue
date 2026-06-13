<template>
  <div class="flex flex-col gap-lg">
    <!-- Header Row -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-md mb-xs">
      <div>
        <h1 class="font-headline-md text-headline-md text-primary mb-xs flex items-center gap-sm">
          <span class="material-symbols-outlined text-[28px]" style="font-variation-settings: 'FILL' 1;">star</span>
          รีวิวแพทย์
        </h1>
        <p class="font-body-md text-body-md text-on-surface-variant">
          รีวิวจากผู้รับบริการจริง ทั้งหมด <span class="font-bold text-on-surface">{{ totalReviews }}</span> รีวิว
          · คะแนนเฉลี่ย <span class="font-bold text-on-surface">{{ avgRating }}/5</span>
        </p>
      </div>
      <!-- Star Summary Badge -->
      <div class="flex items-center gap-sm bg-surface-container-lowest border border-surface-variant rounded-xl px-lg py-md shadow-sm">
        <div class="flex flex-col items-center">
          <span class="text-3xl font-bold text-on-surface leading-none">{{ avgRating }}</span>
          <div class="flex items-center gap-0.5 mt-1">
            <span
              v-for="star in 5" :key="star"
              class="material-symbols-outlined text-[16px]"
              :style="`font-variation-settings: 'FILL' ${star <= Math.round(avgRating) ? 1 : 0};`"
              :class="star <= Math.round(avgRating) ? 'text-tertiary-fixed-dim' : 'text-surface-variant'"
            >star</span>
          </div>
          <span class="text-[10px] text-on-surface-variant mt-0.5">จาก {{ totalReviews }} รีวิว</span>
        </div>
        <div class="w-px h-12 bg-surface-variant mx-sm"></div>
        <!-- Rating Bar Distribution -->
        <div class="flex flex-col gap-0.5 min-w-[120px]">
          <div v-for="dist in [...ratingDistribution].reverse()" :key="dist.star" class="flex items-center gap-sm">
            <span class="text-[10px] text-on-surface-variant w-2 text-right">{{ dist.star }}</span>
            <span class="material-symbols-outlined text-[11px] text-tertiary-fixed-dim" style="font-variation-settings: 'FILL' 1;">star</span>
            <div class="flex-1 h-1.5 bg-surface-variant rounded-full overflow-hidden min-w-[60px]">
              <div
                class="h-full bg-tertiary-fixed-dim rounded-full transition-all duration-700"
                :style="`width: ${totalReviews > 0 ? (dist.count / totalReviews) * 100 : 0}%`"
              ></div>
            </div>
            <span class="text-[10px] text-on-surface-variant w-4">{{ dist.count }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-variant p-md flex flex-wrap items-center gap-md">
      <!-- Text Search -->
      <div class="flex-1 min-w-[200px] relative">
        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
        <input
          v-model="filters.search"
          @input="debounceQuery"
          class="w-full bg-background border border-surface-variant rounded-lg py-sm pl-10 pr-sm font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary transition-all text-xs"
          placeholder="ค้นหาชื่อหมอ, โรงพยาบาล, ความคิดเห็น..."
          type="text"
        />
      </div>

      <!-- Department Filter -->
      <select
        v-model="filters.department"
        @change="applyFilters"
        class="bg-background border border-surface-variant rounded-lg py-sm px-md font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary cursor-pointer text-xs"
      >
        <option value="">แผนก: ทั้งหมด</option>
        <option v-for="dept in deptOptions" :key="dept" :value="dept">{{ dept }}</option>
      </select>

      <!-- Min Rating Filter -->
      <select
        v-model="filters.minRating"
        @change="applyFilters"
        class="bg-background border border-surface-variant rounded-lg py-sm px-md font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary cursor-pointer text-xs"
      >
        <option value="0">คะแนน: ทั้งหมด</option>
        <option value="5">⭐⭐⭐⭐⭐ (5 ดาว)</option>
        <option value="4">⭐⭐⭐⭐+ (4 ดาวขึ้นไป)</option>
        <option value="3">⭐⭐⭐+ (3 ดาวขึ้นไป)</option>
        <option value="2">⭐⭐+ (2 ดาวขึ้นไป)</option>
        <option value="1">⭐+ (1 ดาวขึ้นไป)</option>
      </select>

      <!-- View Toggle -->
      <div class="flex items-center gap-xs border border-surface-variant rounded-lg overflow-hidden">
        <button
          @click="viewMode = 'grid'"
          :class="viewMode === 'grid' ? 'bg-primary text-on-primary' : 'bg-background text-on-surface-variant hover:bg-surface-container'"
          class="p-sm transition-colors"
          title="Grid View"
        >
          <span class="material-symbols-outlined text-[18px]">grid_view</span>
        </button>
        <button
          @click="viewMode = 'list'"
          :class="viewMode === 'list' ? 'bg-primary text-on-primary' : 'bg-background text-on-surface-variant hover:bg-surface-container'"
          class="p-sm transition-colors"
          title="List View"
        >
          <span class="material-symbols-outlined text-[18px]">list</span>
        </button>
      </div>

      <button @click="resetFilters" class="flex items-center gap-xs text-primary font-label-caps text-label-caps px-sm py-sm hover:bg-surface-container rounded-lg transition-colors whitespace-nowrap text-xs font-bold">
        <span class="material-symbols-outlined text-[18px]">tune</span> ล้างตัวกรอง
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex-1 flex flex-col items-center justify-center p-xl min-h-[400px]">
      <div class="relative w-16 h-16 mb-lg">
        <div class="absolute inset-0 rounded-full border-4 border-surface-variant"></div>
        <div class="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
      <p class="text-sm text-outline animate-pulse">กำลังโหลดรีวิวจากฐานข้อมูล...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!reviews.length" class="flex-1 flex flex-col items-center justify-center p-xl min-h-[400px] text-outline">
      <span class="material-symbols-outlined text-[64px] text-surface-variant mb-md">rate_review</span>
      <p class="text-sm mb-sm font-medium">ไม่พบรีวิวตามเงื่อนไขที่กำหนด</p>
      <button @click="resetFilters" class="bg-primary text-on-primary px-md py-sm rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors">
        ล้างตัวกรองทั้งหมด
      </button>
    </div>

    <!-- Grid View -->
    <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md">
      <div
        v-for="review in reviews"
        :key="review.review_id"
        class="bg-surface-container-lowest border border-surface-variant rounded-xl p-md shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer flex flex-col gap-sm group"
        @click="openDetail(review)"
      >
        <!-- Doctor Info Header -->
        <div class="flex items-start gap-sm">
          <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-on-primary shrink-0" :style="`background: ${getDoctorColor(review.target_id)};`">
            {{ getInitials(review.doctor_name) }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-bold text-on-surface text-xs truncate">{{ review.doctor_name }}</p>
            <p class="text-[10px] text-on-surface-variant">{{ review.doctor_department }} · {{ review.doctor_hospital }}</p>
          </div>
          <span
            class="inline-flex items-center gap-0.5 px-sm py-0.5 rounded-full text-[10px] font-bold shrink-0"
            :class="getRatingBadgeClass(review.rating)"
          >
            <span class="material-symbols-outlined text-[10px]" style="font-variation-settings: 'FILL' 1;">star</span>
            {{ review.rating }}.0
          </span>
        </div>

        <!-- Star Display -->
        <div class="flex items-center gap-0.5">
          <span
            v-for="star in 5" :key="star"
            class="material-symbols-outlined text-[14px]"
            :style="`font-variation-settings: 'FILL' ${star <= review.rating ? 1 : 0};`"
            :class="star <= review.rating ? 'text-tertiary-fixed-dim' : 'text-surface-variant'"
          >star</span>
        </div>

        <!-- Comment -->
        <p class="text-xs text-on-surface-variant line-clamp-3 flex-1 italic">"{{ review.comment }}"</p>

        <!-- Footer -->
        <div class="flex items-center justify-between border-t border-surface-variant pt-sm">
          <div class="flex items-center gap-xs">
            <div class="w-5 h-5 rounded-full bg-surface-variant flex items-center justify-center text-[8px] font-bold text-on-surface-variant">
              {{ getInitials(review.reviewer_name) }}
            </div>
            <span class="text-[10px] text-on-surface-variant">{{ review.reviewer_name }}</span>
          </div>
          <span class="text-[10px] text-outline">{{ formatDate(review.timestamp) }}</span>
        </div>

        <!-- Images Preview -->
        <div v-if="review.images && review.images.length > 0" class="flex gap-xs mt-xs">
          <img
            v-for="(img, idx) in review.images.slice(0, 3)"
            :key="idx"
            :src="img"
            alt="Review image"
            class="w-12 h-12 rounded-lg object-cover border border-surface-variant"
          />
        </div>
      </div>
    </div>

    <!-- List View -->
    <div v-else class="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-variant overflow-hidden">
      <table class="w-full text-left border-collapse text-xs">
        <thead>
          <tr class="bg-surface-container border-b border-surface-variant">
            <th class="py-sm px-md font-label-caps text-label-caps text-on-surface-variant whitespace-nowrap">แพทย์</th>
            <th class="py-sm px-md font-label-caps text-label-caps text-on-surface-variant whitespace-nowrap">แผนก / โรงพยาบาล</th>
            <th class="py-sm px-md font-label-caps text-label-caps text-on-surface-variant whitespace-nowrap">คะแนน</th>
            <th class="py-sm px-md font-label-caps text-label-caps text-on-surface-variant whitespace-nowrap">ความคิดเห็น</th>
            <th class="py-sm px-md font-label-caps text-label-caps text-on-surface-variant whitespace-nowrap">ผู้รีวิว</th>
            <th class="py-sm px-md font-label-caps text-label-caps text-on-surface-variant whitespace-nowrap">วันที่</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-surface-variant">
          <tr
            v-for="review in reviews"
            :key="review.review_id"
            class="hover:bg-surface transition-colors cursor-pointer group"
            @click="openDetail(review)"
          >
            <td class="py-md px-md">
              <div class="flex items-center gap-sm">
                <div class="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-on-primary shrink-0" :style="`background: ${getDoctorColor(review.target_id)};`">
                  {{ getInitials(review.doctor_name) }}
                </div>
                <span class="font-medium text-on-surface">{{ review.doctor_name }}</span>
              </div>
            </td>
            <td class="py-md px-md text-on-surface-variant">
              <span>{{ review.doctor_department }}</span>
              <span class="text-outline"> · </span>
              <span>{{ review.doctor_hospital }}</span>
            </td>
            <td class="py-md px-md">
              <div class="flex items-center gap-xs">
                <span class="material-symbols-outlined text-[14px] text-tertiary-fixed-dim" style="font-variation-settings: 'FILL' 1;">star</span>
                <span class="font-bold text-on-surface">{{ review.rating }}</span>
              </div>
            </td>
            <td class="py-md px-md text-on-surface-variant max-w-[200px]">
              <span class="line-clamp-1 italic">"{{ review.comment }}"</span>
            </td>
            <td class="py-md px-md text-on-surface-variant">{{ review.reviewer_name }}</td>
            <td class="py-md px-md text-outline">{{ formatDate(review.timestamp) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-between items-center text-xs">
      <button
        :disabled="page === 1"
        class="bg-surface-container-lowest border border-surface-variant rounded-lg px-3 py-1.5 font-bold hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed"
        @click="changePage(page - 1)"
      >
        ◀ ก่อนหน้า
      </button>
      <span class="text-on-surface-variant">หน้า {{ page }} จาก {{ totalPages }} (ทั้งหมด {{ totalReviews }} รายการ)</span>
      <button
        :disabled="page === totalPages"
        class="bg-surface-container-lowest border border-surface-variant rounded-lg px-3 py-1.5 font-bold hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed"
        @click="changePage(page + 1)"
      >
        ถัดไป ▶
      </button>
    </div>

    <!-- Review Detail Drawer -->
    <div v-if="selectedReview" class="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-300" @click.self="closeDrawer">
      <div class="w-[480px] h-screen bg-surface-container-lowest shadow-2xl border-l border-surface-variant flex flex-col animate-slide-in">
        <!-- Drawer Header -->
        <div class="p-lg border-b border-surface-variant flex justify-between items-center bg-surface-container-low">
          <div>
            <span class="text-[10px] font-bold text-secondary tracking-widest block mb-0.5">REVIEW DETAIL</span>
            <h3 class="font-headline-sm text-base text-primary font-bold">รายละเอียดรีวิว</h3>
          </div>
          <button class="text-on-surface-variant hover:text-on-surface text-2xl font-bold" @click="closeDrawer">×</button>
        </div>

        <!-- Drawer Body -->
        <div class="p-lg overflow-y-auto flex-grow flex flex-col gap-lg text-xs">
          <!-- Doctor Card -->
          <div>
            <h4 class="font-headline-sm text-xs font-bold text-on-surface border-l-4 border-primary pl-sm mb-md">🩺 ข้อมูลแพทย์</h4>
            <div class="flex items-center gap-md bg-surface border border-surface-variant p-md rounded-xl">
              <div class="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-on-primary shrink-0" :style="`background: ${getDoctorColor(selectedReview.target_id)};`">
                {{ getInitials(selectedReview.doctor_name) }}
              </div>
              <div>
                <p class="font-bold text-on-surface text-sm">{{ selectedReview.doctor_name }}</p>
                <p class="text-on-surface-variant mt-0.5">{{ selectedReview.doctor_department }}</p>
                <p class="text-on-surface-variant">🏥 {{ selectedReview.doctor_hospital }}</p>
              </div>
            </div>
          </div>

          <!-- Rating Section -->
          <div>
            <h4 class="font-headline-sm text-xs font-bold text-on-surface border-l-4 border-secondary pl-sm mb-md">⭐ คะแนนและความคิดเห็น</h4>
            <div class="bg-surface border border-surface-variant p-md rounded-xl flex flex-col gap-md">
              <!-- Stars -->
              <div class="flex items-center gap-sm">
                <div class="flex gap-0.5">
                  <span
                    v-for="star in 5" :key="star"
                    class="material-symbols-outlined text-[28px]"
                    :style="`font-variation-settings: 'FILL' ${star <= selectedReview.rating ? 1 : 0};`"
                    :class="star <= selectedReview.rating ? 'text-tertiary-fixed-dim' : 'text-surface-variant'"
                  >star</span>
                </div>
                <span class="text-2xl font-bold text-on-surface">{{ selectedReview.rating }}/5</span>
                <span class="px-sm py-0.5 rounded-full text-xs font-bold" :class="getRatingBadgeClass(selectedReview.rating)">
                  {{ getRatingLabel(selectedReview.rating) }}
                </span>
              </div>

              <!-- Comment -->
              <div class="bg-surface-container p-md rounded-lg border border-surface-variant">
                <p class="text-on-surface italic leading-relaxed">"{{ selectedReview.comment }}"</p>
              </div>
            </div>
          </div>

          <!-- Reviewer Info -->
          <div>
            <h4 class="font-headline-sm text-xs font-bold text-on-surface border-l-4 border-tertiary pl-sm mb-md">👤 ผู้รีวิว</h4>
            <div class="bg-surface border border-surface-variant p-md rounded-xl flex flex-col gap-sm">
              <div class="flex justify-between"><span class="text-on-surface-variant">ชื่อ:</span><span class="font-bold text-on-surface">{{ selectedReview.reviewer_name }}</span></div>
              <div class="flex justify-between"><span class="text-on-surface-variant">ID:</span><span>{{ selectedReview.user_id }}</span></div>
              <div class="flex justify-between"><span class="text-on-surface-variant">วันที่รีวิว:</span><span>{{ formatFullDate(selectedReview.timestamp) }}</span></div>
              <div class="flex justify-between"><span class="text-on-surface-variant">รหัสรีวิว:</span><span class="font-data-mono text-primary">{{ selectedReview.review_id }}</span></div>
            </div>
          </div>

          <!-- Images -->
          <div v-if="selectedReview.images && selectedReview.images.length > 0">
            <h4 class="font-headline-sm text-xs font-bold text-on-surface border-l-4 border-outline pl-sm mb-md">📷 ภาพประกอบรีวิว</h4>
            <div class="grid grid-cols-3 gap-sm">
              <img
                v-for="(img, idx) in selectedReview.images"
                :key="idx"
                :src="img"
                alt="Review image"
                class="w-full aspect-square rounded-lg object-cover border border-surface-variant hover:opacity-90 transition-opacity"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';

// Data state
const reviews = ref([]);
const totalReviews = ref(0);
const avgRating = ref(0);
const ratingDistribution = ref([
  { star: 1, count: 0 }, { star: 2, count: 0 }, { star: 3, count: 0 },
  { star: 4, count: 0 }, { star: 5, count: 0 }
]);
const page = ref(1);
const totalPages = ref(1);
const loading = ref(true);
const selectedReview = ref(null);
const viewMode = ref('grid');

const deptOptions = [
  'Psychiatry', 'Dermatology', 'Gynecology', 'Cardiology',
  'Pediatrics', 'Urology', 'Neurology', 'Oncology', 'Orthopedics'
];

// Color palette for doctor avatars
const doctorColors = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#0ea5e9'
];

const filters = reactive({
  search: '',
  department: '',
  minRating: 0
});

// Debounce
let debounceTimeout = null;
function debounceQuery() {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    page.value = 1;
    applyFilters();
  }, 300);
}

// Helpers
function getInitials(name) {
  if (!name) return 'DR';
  return name.replace('Dr. ', '').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

function getDoctorColor(doctorId) {
  if (!doctorId) return doctorColors[0];
  const idx = parseInt(doctorId.replace('doc-', '')) % doctorColors.length;
  return doctorColors[idx] || doctorColors[0];
}

function getRatingBadgeClass(rating) {
  if (rating >= 5) return 'bg-secondary-container text-on-secondary-container';
  if (rating >= 4) return 'bg-primary-fixed text-on-primary-fixed-variant';
  if (rating >= 3) return 'bg-tertiary-fixed text-on-tertiary-fixed-variant';
  if (rating >= 2) return 'bg-surface-variant text-on-surface-variant';
  return 'bg-error-container text-on-error-container';
}

function getRatingLabel(rating) {
  if (rating === 5) return 'ยอดเยี่ยม';
  if (rating === 4) return 'ดีมาก';
  if (rating === 3) return 'พอใช้';
  if (rating === 2) return 'ต่ำกว่าคาด';
  return 'แย่มาก';
}

function formatDate(isoStr) {
  if (!isoStr) return '';
  return new Date(isoStr).toLocaleDateString('th-TH', {
    day: 'numeric', month: 'short', year: '2-digit'
  });
}

function formatFullDate(isoStr) {
  if (!isoStr) return '';
  return new Date(isoStr).toLocaleString('th-TH', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// Fetch
async function applyFilters() {
  loading.value = true;
  try {
    const data = await $fetch('/api/reviews', {
      query: {
        page: page.value,
        limit: 12,
        search: filters.search,
        department: filters.department,
        minRating: filters.minRating
      }
    });

    if (data.success) {
      reviews.value = data.items;
      totalReviews.value = data.total;
      totalPages.value = data.totalPages;
      avgRating.value = data.avgRating;
      ratingDistribution.value = data.ratingDistribution;
    }
  } catch (error) {
    console.error('Failed to load reviews:', error);
  } finally {
    loading.value = false;
  }
}

function changePage(newPage) {
  if (newPage < 1 || newPage > totalPages.value) return;
  page.value = newPage;
  applyFilters();
}

function openDetail(review) {
  selectedReview.value = review;
}

function closeDrawer() {
  selectedReview.value = null;
}

function resetFilters() {
  filters.search = '';
  filters.department = '';
  filters.minRating = 0;
  page.value = 1;
  applyFilters();
}

onMounted(() => {
  applyFilters();
});
</script>

<style scoped>
.animate-slide-in {
  animation: slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.1) forwards;
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
