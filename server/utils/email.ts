import { MailerooClient, EmailAddress } from "maileroo-sdk";
import { EmailTemplate } from "~~/types/email";

const client = new MailerooClient(process.env.MAILEROO_API_KEY as string);

export const sendTemplatedEmail = async (
    recipient: { email: string; name?: string },
    subject: string,
    templateId: EmailTemplate,
    data?: Record<string, any>,
) => {
    try {
        const referenceId = await client.sendTemplatedEmail({
            from: new EmailAddress(
                process.env.MAILEROO_FROM_EMAIL as string,
                process.env.MAILEROO_FROM_NAME as string,
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