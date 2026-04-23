/**
 * Images are served directly from the public Cloudflare R2 bucket.
 * This proxy route is no longer needed — images are accessed via the R2_PUBLIC_URL directly.
 * Keeping this file as a redirect in case old URLs are used.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { pathname } = event.context.params || {}
  const r2Base = config.r2PublicUrl || process.env.R2_PUBLIC_URL

  if (!pathname || !r2Base) {
    throw createError({ statusCode: 404, message: 'Image not found' })
  }

  // Redirect to public R2 URL
  await sendRedirect(event, `${r2Base}/${pathname}`, 301)
})
