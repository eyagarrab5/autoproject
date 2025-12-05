const { computePredictions } = require('./predict');
const { sendMail } = require('./mailer');
const { sendSms } = require('./sms');

function listFromEnv(name) {
  const v = process.env[name];
  if (!v) return [];
  return String(v).split(',').map(s => s.trim()).filter(Boolean);
}

function formatEmailSubjectUrgent(v) {
  return `\u26a1 Maintenance urgente - ${v.id} (${v.marque || ''} ${v.modele || ''})`;
}

function formatEmailBodyUrgent(v) {
  return [
    `La voiture ${v.id} (${v.marque || ''} ${v.modele || ''}) nécessite une maintenance urgente.`,
    `- Kilométrage: ${v.kilometrage} km (prochaine révision à ${v.prochaine_revision_km} km)`,
    `- Risque panne: ${Math.round((v.risque_panne_imminente||0)*100)}%`,
    `- Urgence estimée: ${v.urgence_maintenance_jours} jours`,
    `- Action recommandée: ${v.type_prevu === 'major' ? 'Révision majeure' : 'Révision périodique'}`,
    '',
    'Merci de planifier l\'intervention.'
  ].join('\n');
}

function formatSmsUrgent(v) {
  return `\ud83d\ude97 ALERTE: ${v.id} - Maintenance urgente. Km ${v.kilometrage}. Contacter atelier.`;
}

function formatEmailReminder(v) {
  return [
    `Rappel maintenance - ${v.id} (${v.marque || ''} ${v.modele || ''})`,
    `- Prochaine révision le ${v.prochaine_revision_date}`,
    `- Dans ${v.urgence_maintenance_jours} jours (ou à ${v.prochaine_revision_km} km)`,
  ].join('\n');
}

function buildNotificationsFrom(pred) {
  const emails = [];
  const sms = [];
  const emailList = listFromEnv('MAINT_EMAILS');
  const smsList = listFromEnv('MAINT_SMS');

  // Urgence: <= 7 jours ou risque >= 0.7
  const urgentSet = new Set();
  pred.estimation_par_vehicule.forEach(v => {
    const isUrgentDate = v.urgence_maintenance_jours != null && v.urgence_maintenance_jours <= 7;
    const isHighRisk = (v.risque_panne_imminente || 0) >= 0.7;
    if (isUrgentDate || isHighRisk) {
      urgentSet.add(v.id);
      if (emailList.length) {
        emails.push({
          to: emailList,
          subject: formatEmailSubjectUrgent(v),
          text: formatEmailBodyUrgent(v),
        });
      }
      if (smsList.length && (isHighRisk || (v.urgence_maintenance_jours != null && v.urgence_maintenance_jours <= 1))) {
        sms.push({ to: smsList, body: formatSmsUrgent(v) });
      }
    }
  });

  // Rappel J-7: véhicules planifiés sous 7 jours mais non marqués urgents (déjà inclus), on envoie rappel email si pas urgent
  pred.vehicules_a_maintenir_15j.forEach(v => {
    // J-7 approximatif: 6..8 jours
    if (v.urgence_maintenance_jours != null && v.urgence_maintenance_jours >= 6 && v.urgence_maintenance_jours <= 8) {
      if (!urgentSet.has(v.id) && emailList.length) {
        emails.push({ to: emailList, subject: `Rappel maintenance - ${v.id}`, text: formatEmailReminder(v) });
      }
    }
  });

  return { emails, sms };
}

async function previewNotifications() {
  const pred = await computePredictions();
  const notif = buildNotificationsFrom(pred);
  return { pred, notifications: notif };
}

async function runNotifications() {
  const { pred, notifications } = await previewNotifications();
  let sentEmails = 0; let sentSms = 0; let skippedEmails = 0; let skippedSms = 0;
  for (const m of notifications.emails) {
    const toList = Array.isArray(m.to) ? m.to : [m.to];
    for (const to of toList) {
      try {
        const r = await sendMail({ to, subject: m.subject, text: m.text });
        if (r.skipped) skippedEmails++; else sentEmails++;
      } catch (e) { console.warn('[mailer] error', e.message); }
    }
  }
  for (const s of notifications.sms) {
    const toList = Array.isArray(s.to) ? s.to : [s.to];
    for (const to of toList) {
      try {
        const r = await sendSms({ to, body: s.body });
        if (r.skipped) skippedSms++; else sentSms++;
      } catch (e) { console.warn('[sms] error', e.message); }
    }
  }
  return { summary: { sentEmails, sentSms, skippedEmails, skippedSms }, pred };
}

module.exports = { buildNotificationsFrom, previewNotifications, runNotifications };
