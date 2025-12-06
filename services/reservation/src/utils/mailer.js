const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.mailtrap.io',
  port: Number(process.env.MAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/**
 * Send contract email with PDF attachment
 */
async function sendContractEmail(to, subject, text, attachmentPath) {
  try {
    const mailOptions = {
      from: process.env.MAIL_FROM || process.env.MAIL_USER || 'noreply@location.com',
      to,
      subject,
      text,
      attachments: attachmentPath ? [{ path: attachmentPath }] : [],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email send error:', error.message);
    // Don't throw - email failure shouldn't break the flow
    return null;
  }
}

/**
 * Send reservation confirmation email
 */
async function sendReservationConfirmation(to, reservationData) {
  const subject = 'Confirmation de votre réservation';
  const text = `
Bonjour,

Votre réservation a été confirmée avec succès.

Détails de la réservation:
- Voiture: ${reservationData.voitureInfo?.marque || ''} ${reservationData.voitureInfo?.modele || ''}
- Date de début: ${new Date(reservationData.dateDebut).toLocaleDateString('fr-FR')}
- Date de fin: ${new Date(reservationData.dateFin).toLocaleDateString('fr-FR')}
- Lieu de retrait: ${reservationData.lieuRetrait}
- Lieu de retour: ${reservationData.lieuRetour}
- Montant total: ${reservationData.montant} TND

Merci pour votre confiance.
L'équipe de Location Auto
  `;

  return sendContractEmail(to, subject, text, null);
}

module.exports = { 
  sendContractEmail, 
  sendReservationConfirmation 
};
