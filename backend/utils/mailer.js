const nodemailer = require("nodemailer");

let transporter = null;

// Lazily create the transporter so a missing SMTP config doesn't crash the app at boot
const getTransporter = () => {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
};

// Sends an email; logs and swallows errors so a mail failure never breaks the calling request
const sendMail = async ({ to, subject, html }) => {
  const t = getTransporter();
  if (!t) {
    console.warn("Email not sent (SMTP not configured):", subject, "->", to);
    return;
  }
  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("Email send failed:", subject, "->", to, err.message);
  }
};

module.exports = { sendMail };
