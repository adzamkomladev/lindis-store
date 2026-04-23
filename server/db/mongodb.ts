import { MongoClient, type Db } from 'mongodb'

let client: MongoClient | null = null
let db: Db | null = null

/**
 * Connect to MongoDB. Singleton — safe to call multiple times.
 * Pool sized for long-running VPS/OLTP workload per MongoDB Connection Skill.
 */
export async function connectDB(): Promise<Db> {
  if (db) return db

  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('[MongoDB] MONGODB_URI environment variable is not set')

  client = new MongoClient(uri, {
    maxPoolSize: 50,             // Based on expected concurrent requests
    minPoolSize: 10,             // Pre-warmed connections for traffic spikes
    maxIdleTimeMS: 300_000,      // 5 min — stable server benefits from persistent connections
    connectTimeoutMS: 5_000,     // Fail fast on connection issues
    socketTimeoutMS: 30_000,     // Prevent hanging queries
    serverSelectionTimeoutMS: 5_000,
  })

  await client.connect()
  const dbName = process.env.MONGODB_DB_NAME || 'lindis-store'
  db = client.db(dbName)
  console.log(`[MongoDB] Connected successfully to database: ${dbName}`)
  return db
}

export function getDB(): Db {
  if (!db) throw new Error('[MongoDB] Not connected. connectDB() must be called first.')
  return db
}

export async function closeDB(): Promise<void> {
  if (client) {
    await client.close()
    client = null
    db = null
    console.log('[MongoDB] Connection closed')
  }
}
