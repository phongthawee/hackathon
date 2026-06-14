export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/supabase'],
  
  // 👉 1. แก้ปัญหา 404 (ปิดการบังคับเด้งไปหน้า login)
  supabase: {
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/*'], // บรรทัดนี้สำคัญมาก! แปลว่า "ยกเว้นทุกหน้า ไม่ต้องบังคับล็อกอิน"
    }
  },

  // 👉 2. แก้แจ้งเตือนของ Vite (ใส่ตามที่ระบบแนะนำ)
  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
      ]
    }
  },
  
  app: {
    head: {
      title: 'Health Radar - Surveillance & Outbreak System',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap' },
        { rel: 'stylesheet', href: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css' },
        { rel: 'stylesheet', href: 'https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css' },
        { rel: 'stylesheet', href: 'https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css' }
      ],
      script: [
        { src: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js' },
        { src: 'https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js' }
      ]
    }
  },

  runtimeConfig: {
    public: {
      longdoKey: process.env.NUXT_PUBLIC_LONGDO_KEY || ''
    }
  }
})