const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

async function sendContractEmail(to, subject, text, attachmentPath) {
  const mailOptions = {
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject,
    text,
    attachments: [
      {
        path: attachmentPath,
      },
    ],
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendContractEmail };
