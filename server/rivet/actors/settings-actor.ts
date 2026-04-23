import { actor, event } from 'rivetkit'

interface SiteSettings {
  bannerText: string
  storeName: string
  storeEmail: string
  storePhone?: string
  storeAddress?: string
  currency: string
  currencySymbol: string
  lowStockThreshold: number
}

const DEFAULT_SETTINGS: SiteSettings = {
  bannerText: '',
  storeName: "Lindi's Store",
  storeEmail: 'store@lindis-store.com',
  currency: 'GHS',
  currencySymbol: '₵',
  lowStockThreshold: 5,
}

export const settingsActor = actor({
  options: { name: 'Site Settings', icon: '⚙️' },
  state: { ...DEFAULT_SETTINGS } as SiteSettings,
  events: {
    settingsUpdated: event<Partial<SiteSettings>>(),
  },
  actions: {
    get: <K extends keyof SiteSettings>(c: any, key: K): SiteSettings[K] => c.state[key],

    getAll: (c): SiteSettings => ({ ...c.state }),

    update: (c, updates: Partial<SiteSettings>): SiteSettings => {
      Object.assign(c.state, updates)
      c.broadcast('settingsUpdated', updates)
      return { ...c.state }
    },

    getBannerText: (c): string => c.state.bannerText,

    setBannerText: (c, text: string): void => {
      c.state.bannerText = text
      c.broadcast('settingsUpdated', { bannerText: text })
    },
  },
})
