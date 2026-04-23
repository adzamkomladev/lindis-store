import { useR2 } from '~/server/utils/r2'

export default defineEventHandler(async (event) => {
  // Require admin session
  const session = await requireUserSession(event)
  if (session.user.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const form = await readMultipartFormData(event)
  if (!form || form.length === 0) {
    throw createError({ statusCode: 400, message: 'No file uploaded' })
  }

  const file = form[0]
  if (!file.filename || !file.type) {
    throw createError({ statusCode: 400, message: 'Invalid file' })
  }

  if (!file.type.startsWith('image/')) {
    throw createError({ statusCode: 400, message: 'File must be an image' })
  }

  // Generate a unique key with timestamp
  const ext = file.filename.split('.').pop()
  const key = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  // Upload to Cloudflare R2 public bucket (direct S3 API — no presigned URLs)
  const r2 = useR2()
  const result = await r2.upload(key, file.data, file.type)

  return {
    key: result.key,
    url: result.url, // Full public URL
    pathname: result.key,
  }
})
