const nodemailer = require('nodemailer');

function createTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT) {
    console.warn('[mailer] SMTP not configured; emails disabled');
    return null;
  }
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
  return transporter;
}

async function sendMail({ to, subject, text, html }) {
  const transporter = createTransport();
  if (!transporter) return { ok: false, skipped: true };
  const from = process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@example.com';
  await transporter.sendMail({ from, to, subject, text, html });
  return { ok: true };
}

module.exports = { sendMail };
