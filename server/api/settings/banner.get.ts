import { isRivetRunnerUnavailable, useRivet } from '~/server/rivet/client'

export default cachedEventHandler(async () => {
  try {
    const rivet = useRivet()
    const bannerText = await rivet.settingsActor.getOrCreate(['main']).getBannerText()
    return { bannerText }
  } catch (error) {
    if (!isRivetRunnerUnavailable(error)) throw error

    console.warn('[Rivet] Falling back to default banner settings:', (error as Error).message)
    return { bannerText: '' }
  }
}, {
  maxAge: 60 * 5,
  name: 'banner-settings',
})
