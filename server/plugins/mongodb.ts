import { connectDB } from '../db/mongodb'
import { createIndexes } from '../db/indexes'

/**
 * Nitro plugin — runs once on server startup.
 * Connects to MongoDB and ensures all indexes exist.
 */
export default defineNitroPlugin(async () => {
  try {
    const db = await connectDB()
    await createIndexes(db)
    console.log('[MongoDB] Database ready')
  } catch (error) {
    console.error('[MongoDB] Failed to initialize database:', (error as Error).message)
    // In production we want to know immediately if DB is unreachable
    throw error
  }
})
