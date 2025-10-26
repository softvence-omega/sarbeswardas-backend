import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmailWithResend = async (to: string, subject: string, html: any) => {
  try {
    await resend.emails.send({
      from: "Your App mypcmail093@gmail.com",
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("❌ Email send failed:", err);
  }
};
