import { actor, queue } from 'rivetkit'
import { MailerooClient } from 'maileroo-sdk'

export interface EmailPayload {
  to: string
  subject: string
  templateId: string
  data: Record<string, unknown>
}

export const emailWorker = actor({
  options: { name: 'Email Worker', icon: '📧' },
  state: {
    sent: 0,
    failed: 0,
    lastError: null as string | null,
  },
  queues: {
    emails: queue<EmailPayload>(),
  },
  run: async (c) => {
    for await (const message of c.queue.iter()) {
      const { to, subject, templateId, data } = message.body

      const apiKey = process.env.MAILEROO_API_KEY
      const fromEmail = process.env.MAILEROO_FROM_EMAIL ?? 'store@lindis-store.com'
      const fromName = process.env.MAILEROO_FROM_NAME ?? "Lindi's Store"

      if (!apiKey) {
        console.error('[EmailWorker] MAILEROO_API_KEY is not set')
        c.state.failed += 1
        continue
      }

      const maileroo = new MailerooClient({ apiKey })

      try {
        await maileroo.send({
          from: `${fromName} <${fromEmail}>`,
          to,
          subject,
          template_id: templateId,
          template_variables: data,
        })
        c.state.sent += 1
        c.state.lastError = null
      } catch (error) {
        console.error('[EmailWorker] Failed to send email:', (error as Error).message)
        c.state.failed += 1
        c.state.lastError = (error as Error).message
        // Don't rethrow — failed emails shouldn't crash the worker
      }
    }
  },
  actions: {
    getStats: (c) => ({
      sent: c.state.sent,
      failed: c.state.failed,
      lastError: c.state.lastError,
    }),
  },
})
