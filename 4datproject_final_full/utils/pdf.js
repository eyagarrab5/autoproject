const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");

exports.makePDF = async (contrat, reservation) => {
  return new Promise(async (resolve, reject) => {
    try {
      const folderPath = path.join(__dirname, "..", "uploads", "contrats");

      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const fileName = `CTR-${Date.now()}.pdf`;
      const filePath = path.join(folderPath, fileName);

      const doc = new PDFDocument({
        margin: 40,
        size: "A4",
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // ============================
      // 🔷 Header
      // ============================
      const logoPath = path.join(__dirname, "..", "assets", "logo.png");
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 40, 40, { width: 120 });
      }

      doc.fontSize(20)
        .font("Helvetica-Bold")
        .text("Agence Location", 180, 45)
        .fontSize(10)
        .text("Adresse : Tunis, Tunisie", 180, 70)
        .text("Téléphone : +216 20 000 000")
        .text("Email : contact@agence-location.com");

      doc.moveTo(40, 120).lineTo(550, 120).strokeColor("#007ACC").stroke();

      // ============================
      // 🔷 Titre
      // ============================
      doc.moveDown(1);
      doc.fontSize(22)
        .fillColor("#007ACC")
        .font("Helvetica-Bold")
        .text("CONTRAT DE LOCATION", { align: "center" });

      const sectionTitle = (title) => {
        doc.moveDown(0.3)
          .fontSize(14)
          .fillColor("#007ACC")
          .font("Helvetica-Bold")
          .text(title)
          .fillColor("black")
          .font("Helvetica")
          .moveDown(0.3);
      };

      // ============================
      // 🔷 Informations du contrat
      // ============================
      sectionTitle("Informations du contrat");

      doc.fontSize(12)
        .text(`Numéro du contrat : ${contrat.numero}`)
        .text(`Lieu : ${contrat.lieu}`)
        .text(`Date de création : ${contrat.date.toLocaleString()}`)
        .text(`Statut : ${contrat.statut}`);

      // ============================
      // 🔷 Informations réservation
      // ============================
      sectionTitle("Informations de la réservation");

      doc.text(`ID Réservation : ${contrat.reservation}`)
        .text(`Date début : ${reservation.dateDebut}`)
        .text(`Date fin : ${reservation.dateFin}`)
        .text(`Montant Total : ${contrat.montantTotal} TND`)
        .text(`Lieu de retrait : ${reservation.lieuRetrait}`)
        .text(`Lieu de retour : ${reservation.lieuRetour}`);

      // ============================
      // 🔷 Client
      // ============================
      sectionTitle("Informations du client");

      doc.text(`Nom du client : ${reservation.user?.name}`)
         .text(`Email : ${reservation.user?.email}`);

      // ============================
      // 🔷 Conditions
      // ============================
      sectionTitle("Conditions du contrat");

      doc.text(contrat.conditions);

      // ============================
      // 🔷 Cadres de signatures
      // ============================
      sectionTitle("Signatures");

      doc.text(`Signature du client (${reservation.user?.name}) :`);
      doc.rect(doc.x, doc.y + 5, 220, 70).stroke();
      const sigY = doc.y + 90;

      doc.moveDown(6);

      doc.text("Signature de l'agence :");
      doc.rect(doc.x, doc.y + 5, 220, 70).stroke();

      // ============================
      // 🔷 QR Code
      // ============================
      const verificationURL = `https://votre-domaine.com/verify/${contrat._id}`;
      const qrFolder = path.join(__dirname, "..", "uploads", "qr");
      if (!fs.existsSync(qrFolder)) fs.mkdirSync(qrFolder, { recursive: true });

      const qrTempPath = path.join(qrFolder, `qr_${contrat._id}.png`);
      await QRCode.toFile(qrTempPath, verificationURL);

      doc.moveDown(2);
      doc.fontSize(12).text("Vérification électronique du contrat :", { align: "center" });
      doc.image(qrTempPath, doc.page.width / 2 - 60, doc.y, { width: 120 });

      doc.moveDown(1).fontSize(10).text(verificationURL, {
        align: "center",
        link: verificationURL
      });

      // ============================
      // 🔷 Pied de page
      // ============================
      doc.fillColor("gray")
        .fontSize(10)
        .text(
          `Document généré automatiquement – Agence Location © ${new Date().getFullYear()}`,
          40,
          doc.page.height - 60,
          { align: "center" }
        );

      doc.end();

      stream.on("finish", () => resolve({ filePath, fileName }));
      stream.on("error", reject);

    } catch (err) {
      reject(err);
    }
  });
};
