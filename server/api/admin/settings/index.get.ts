import { useRivet, isRivetRunnerUnavailable } from '~/server/rivet/client'

const DEFAULT_SETTINGS = {
  bannerText: '',
  storeName: "Lindi's Store",
  storeEmail: 'store@lindis-store.com',
  currency: 'GHS',
  currencySymbol: '₵',
  lowStockThreshold: 5,
  notifOrder: 'true',
  notifNew: 'true',
  notifStock: 'false',
}

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  try {
    const rivet = useRivet()
    const settings = await rivet.settingsActor.getOrCreate(['main']).getAll()
    
    // Transform to array format expected by frontend
    return [
      { key: 'store_name', value: settings.storeName },
      { key: 'support_email', value: settings.storeEmail },
      { key: 'currency', value: settings.currency },
      { key: 'banner_text', value: settings.bannerText },
      { key: 'notif_order', value: settings.notifOrder ?? 'true' },
      { key: 'notif_new', value: settings.notifNew ?? 'true' },
      { key: 'notif_stock', value: settings.notifStock ?? 'false' },
    ]
  } catch (error) {
    if (!isRivetRunnerUnavailable(error)) throw error

    console.warn('[Rivet] Falling back to defaults for settings')
    return [
      { key: 'store_name', value: DEFAULT_SETTINGS.storeName },
      { key: 'support_email', value: DEFAULT_SETTINGS.storeEmail },
      { key: 'currency', value: DEFAULT_SETTINGS.currency },
      { key: 'banner_text', value: DEFAULT_SETTINGS.bannerText },
      { key: 'notif_order', value: DEFAULT_SETTINGS.notifOrder },
      { key: 'notif_new', value: DEFAULT_SETTINGS.notifNew },
      { key: 'notif_stock', value: DEFAULT_SETTINGS.notifStock },
    ]
  }
})
