import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-03-10',
  devtools: { enabled: false },
  modules: [
    '@nuxt/image',
    '@nuxt/hints',
    'nuxt-auth-utils',
    'shadcn-nuxt'
  ],
  app: {
    head: {
      title: "Lindi's Store",
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1' },
        { name: 'description', content: "Lindi's Store — Premium kitchen equipment, blenders, baking tools, utensils, and tupperwares." }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400..900;1,400..900&family=Manrope:wght@400;500;600;700&display=swap' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap' }
      ]
    }
  },
  css: ['~/assets/css/tailwind.css'],
  vite: {
    optimizeDeps: {
      include: [
        '@vueuse/core',
        'lucide-vue-next',
        'reka-ui',
        'class-variance-authority',
        'clsx',
        'tailwind-merge',
        'vee-validate',
        '@vee-validate/zod',
        'zod',
      ]
    },
    plugins: [
      tailwindcss(),
    ],
    server: {
      allowedHosts: ['local-dove.wysemarket.com']
    }
  },
  shadcn: {
    prefix: '',
    componentDir: '@/components/ui',
  },
  image: {
    provider: 'cloudflare',
    cloudflare: {
      baseURL: process.env.R2_PUBLIC_URL
    }
  },
  runtimeConfig: {
    // Server-only secrets
    mongodbUri: process.env.MONGODB_URI,
    mongodbDbName: process.env.MONGODB_DB_NAME,
    rivetEndpoint: process.env.RIVET_ENDPOINT,
    rivetPublicEndpoint: process.env.RIVET_PUBLIC_ENDPOINT,
    paystackSecretKey: process.env.PAYSTACK_SECRET_KEY,
    r2AccountId: process.env.R2_ACCOUNT_ID,
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID,
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    r2BucketName: process.env.R2_BUCKET_NAME,
    r2PublicUrl: process.env.R2_PUBLIC_URL,
    sessionPassword: process.env.NUXT_SESSION_PASSWORD,
    mailerooApiKey: process.env.MAILEROO_API_KEY,
    mailerooFromEmail: process.env.MAILEROO_FROM_EMAIL,
    mailerooFromName: process.env.MAILEROO_FROM_NAME,
    public: {
      baseUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    }
  },
  nitro: {
    // Self-hosted VPS via Coolify — standard Node.js server
    preset: 'node-server',
    experimental: {
      websocket: true
    },
    // Fix: Nuxt 4 srcDir is 'app/', but server files live at root 'server/'
    // ~ resolves to app/, so ~/server/ breaks. Alias explicitly.
    alias: {
      '~/server': `${__dirname}/server`,
      '~~/schemas': `${__dirname}/schemas`,
      '~~/types': `${__dirname}/types`,
    },
    routeRules: {
      '/api/admin/**': {
        cache: false,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache'
        }
      }
    }
  }
})
