const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

/**
 * Generate PDF contract
 */
exports.makePDF = async (contrat, reservation) => {
  return new Promise(async (resolve, reject) => {
    try {
      const folderPath = path.join(__dirname, '..', '..', 'uploads', 'contrats');

      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const fileName = `CTR-${Date.now()}.pdf`;
      const filePath = path.join(folderPath, fileName);

      const doc = new PDFDocument({
        margin: 40,
        size: 'A4',
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // ============================
      // Header
      // ============================
      const logoPath = path.join(__dirname, '..', '..', 'assets', 'logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 40, 40, { width: 120 });
      }

      doc.fontSize(20)
        .font('Helvetica-Bold')
        .text('Agence Location', 180, 45)
        .fontSize(10)
        .text('Adresse : Tunis, Tunisie', 180, 70)
        .text('Téléphone : +216 20 000 000')
        .text('Email : contact@agence-location.com');

      doc.moveTo(40, 120).lineTo(550, 120).strokeColor('#007ACC').stroke();

      // ============================
      // Title
      // ============================
      doc.moveDown(1);
      doc.fontSize(22)
        .fillColor('#007ACC')
        .font('Helvetica-Bold')
        .text('CONTRAT DE LOCATION', { align: 'center' });

      const sectionTitle = (title) => {
        doc.moveDown(0.3)
          .fontSize(14)
          .fillColor('#007ACC')
          .font('Helvetica-Bold')
          .text(title)
          .fillColor('black')
          .font('Helvetica')
          .moveDown(0.3);
      };

      // ============================
      // Contract Information
      // ============================
      sectionTitle('Informations du contrat');

      doc.fontSize(12)
        .text(`Numéro du contrat : ${contrat.numero}`)
        .text(`Lieu : ${contrat.lieu}`)
        .text(`Date de création : ${new Date(contrat.date).toLocaleString('fr-FR')}`)
        .text(`Statut : ${contrat.statut}`);

      // ============================
      // Reservation Information
      // ============================
      sectionTitle('Informations de la réservation');

      doc.text(`ID Réservation : ${reservation._id}`)
        .text(`Date début : ${new Date(reservation.dateDebut).toLocaleDateString('fr-FR')}`)
        .text(`Date fin : ${new Date(reservation.dateFin).toLocaleDateString('fr-FR')}`)
        .text(`Montant Total : ${contrat.montantTotal} TND`)
        .text(`Lieu de retrait : ${reservation.lieuRetrait}`)
        .text(`Lieu de retour : ${reservation.lieuRetour}`);

      // ============================
      // Vehicle Information
      // ============================
      if (reservation.voitureInfo) {
        sectionTitle('Informations du véhicule');
        doc.text(`Matricule : ${reservation.voitureInfo.matricule || 'N/A'}`)
          .text(`Marque : ${reservation.voitureInfo.marque || 'N/A'}`)
          .text(`Modèle : ${reservation.voitureInfo.modele || 'N/A'}`);
      }

      // ============================
      // Client Information
      // ============================
      sectionTitle('Informations du client');

      doc.text(`Nom du client : ${reservation.userInfo?.name || contrat.signataire}`)
        .text(`Email : ${reservation.userInfo?.email || 'N/A'}`);

      // ============================
      // Conditions
      // ============================
      sectionTitle('Conditions du contrat');
      doc.text(contrat.conditions || 'Standard rental terms and conditions apply.');

      // ============================
      // QR Code
      // ============================
      try {
        const qrData = JSON.stringify({
          contrat: contrat.numero,
          reservation: reservation._id,
          montant: contrat.montantTotal
        });
        const qrCodeDataUrl = await QRCode.toDataURL(qrData);
        const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
        
        doc.moveDown(1);
        doc.image(qrBuffer, 450, doc.y, { width: 80 });
      } catch (qrError) {
        console.warn('QR Code generation failed:', qrError.message);
      }

      // ============================
      // Signature
      // ============================
      doc.moveDown(2);
      sectionTitle('Signature');
      doc.text(`Signataire : ${contrat.signataire}`)
        .text(`Date de signature : ${contrat.dateSignature ? new Date(contrat.dateSignature).toLocaleDateString('fr-FR') : 'Non signé'}`);

      // ============================
      // Footer
      // ============================
      doc.moveDown(2);
      doc.fontSize(8)
        .fillColor('gray')
        .text('Ce document est généré automatiquement et fait foi de contrat de location.', { align: 'center' });

      doc.end();

      stream.on('finish', () => {
        resolve({ filePath, fileName });
      });

      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};
