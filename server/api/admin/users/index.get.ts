import { collections } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const { users } = collections()

  const result = await users
    .find({})
    .sort({ createdAt: -1 })
    .project({ _id: 1, email: 1, name: 1, role: 1, createdAt: 1 }) // Never expose credentials
    .toArray()

  return result
})
