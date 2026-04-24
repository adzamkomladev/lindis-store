import { useRivet, isRivetRunnerUnavailable } from '~/server/rivet/client'

const DEFAULT_SETTINGS = {
  bannerText: '',
  storeName: "Lindi's Store",
  storeEmail: 'store@lindis-store.com',
  currency: 'GHS',
  currencySymbol: '₵',
  lowStockThreshold: 5,
}

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  try {
    const rivet = useRivet()
    return await rivet.settingsActor.getOrCreate(['main']).getAll()
  } catch (error) {
    if (!isRivetRunnerUnavailable(error)) throw error

    console.warn('[Rivet] Falling back to defaults for settings')
    return DEFAULT_SETTINGS
  }
})
