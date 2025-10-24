import nodemailer from "nodemailer";

export const sendEmailWithBrevo = async (to: string, subject: string, html: string) => {
  try {
    // Transporter config using Brevo SMTP
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      auth: {
        user: process.env.BREVO_EMAIL, // Your Brevo login email
        pass: process.env.BREVO_SMTP_KEY, // Your Brevo SMTP key
      },
    });

    const mailOptions = {
      from: `"Your App" <${process.env.BREVO_EMAIL}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    // console.log("✅ Email sent successfully:", info.messageId);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Email send failed:", error);
    return { success: false, error };
  }
};
