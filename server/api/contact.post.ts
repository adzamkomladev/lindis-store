import { z } from 'zod'
import { collections } from '~/server/utils/db'

const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Please enter a valid email'),
  subject: z.string().min(3, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, contactSchema.parse)
  const { contacts } = collections()

  await contacts.insertOne({
    name: body.name,
    email: body.email,
    subject: body.subject,
    message: body.message,
    status: 'new',
    createdAt: new Date(),
  })

  return { success: true }
})
