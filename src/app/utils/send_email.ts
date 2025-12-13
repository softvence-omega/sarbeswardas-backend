import nodemailer from "nodemailer";

export const sendEmail = async (to: string, subject: string, html: string) => {
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = port === 465; // true for 465, false for other ports

  // 1️⃣ Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure, 
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false, // Helps with self-signed certs in dev/some hosts
    },
  });

  try {
    // 2️⃣ Send the email
    const info = await transporter.sendMail({
      from: `"Sarbeswar Das" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      // replyTo: process.env.SMTP_USER
    });

    // console.log("📧 Email sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    // Don't throw if you don't want to break the flow, but usually good to know
    // throw error; 
  }
};
