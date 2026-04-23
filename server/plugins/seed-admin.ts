import { connectDB } from '../db/mongodb'
import { collections } from '../db/collections'

/**
 * Nitro plugin — seeds the default admin user on first run.
 * Calls connectDB() itself to guarantee the connection is ready
 * (idempotent — no-ops if already connected).
 */
export default defineNitroPlugin(async () => {
  const adminEmail = process.env.ADMIN_SEED_EMAIL || 'adzamkomla.dev@gmail.com'
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'Password@12345'
  const adminName = 'Admin'

  try {
    await connectDB()
    const { users } = collections()

    const existingAdmin = await users.findOne({ email: adminEmail })
    if (existingAdmin) {
      console.log(`[Seed] Admin already exists: ${adminEmail}`)
      return
    }

    const now = new Date()
    await users.insertOne({
      email: adminEmail,
      name: adminName,
      role: 'admin',
      // 1:1 embed pattern — credentials in same document (no accounts table)
      credentials: [
        {
          provider: 'local',
          passwordHash: await hashPassword(adminPassword),
        },
      ],
      createdAt: now,
      updatedAt: now,
    })

    console.log(`[Seed] Admin user created: ${adminEmail}`)
  } catch (error) {
    console.warn('[Seed] Could not seed admin user:', (error as Error).message)
  }
})
