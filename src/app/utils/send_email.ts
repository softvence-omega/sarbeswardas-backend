import nodemailer from "nodemailer";

export const sendEmail = async (to: string, subject: string, html: string) => {
  // 1️⃣ Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, // e.g. "smtp.gmail.com"
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER, // your email
      pass: process.env.SMTP_PASS, // your email password or app password
    },
  });

  // 2️⃣ Send the email
  const info = await transporter.sendMail({
    from: `"Your App" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });

  //   console.log("📧 Email sent:", info.messageId);
};
