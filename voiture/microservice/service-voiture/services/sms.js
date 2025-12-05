let twilioClient = null;

function initTwilio() {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.warn('[sms] Twilio not configured; SMS disabled');
    return null;
  }
  if (!twilioClient) twilioClient = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  return twilioClient;
}

async function sendSms({ to, body }) {
  const client = initTwilio();
  if (!client) return { ok: false, skipped: true };
  const from = process.env.TWILIO_FROM;
  if (!from) {
    console.warn('[sms] TWILIO_FROM not set; SMS skipped');
    return { ok: false, skipped: true };
  }
  await client.messages.create({ to, from, body });
  return { ok: true };
}

module.exports = { sendSms };
