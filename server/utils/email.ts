import { MailerooClient, EmailAddress } from "maileroo-sdk";
import { EmailTemplate } from "~~/types/email";

function getMailerooClient(): MailerooClient | undefined {
  const config = useRuntimeConfig()
  const apiKey = config.mailerooApiKey || process.env.MAILEROO_API_KEY
  if (!apiKey) {
    console.warn('[email] MAILEROO_API_KEY not configured; emails will not be sent')
    return undefined
  }
  return new MailerooClient(apiKey)
}

export const sendTemplatedEmail = async (
    recipient: { email: string; name?: string },
    subject: string,
    templateId: EmailTemplate,
    data?: Record<string, any>,
) => {
    const client = getMailerooClient()
    if (!client) return

    try {
        const config = useRuntimeConfig()
        const referenceId = await client.sendTemplatedEmail({
            from: new EmailAddress(
                config.mailerooFromEmail || process.env.MAILEROO_FROM_EMAIL || 'store@lindis-store.com',
                config.mailerooFromName || process.env.MAILEROO_FROM_NAME || "Lindi's Store",
            ),
            to: [new EmailAddress(recipient.email, recipient.name)],
            subject,
            template_id: templateId,
            template_data: data,
        });

        console.log("Email sent successfully. Reference ID:", referenceId);
    } catch (error) {
        console.error("Error sending email:", error);
    }
};