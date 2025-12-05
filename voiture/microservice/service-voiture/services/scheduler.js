const cron = require('node-cron');
const { runNotifications } = require('./notifier');

function startScheduler() {
  const enabled = String(process.env.CRON_ENABLED || 'false').toLowerCase() === 'true';
  if (!enabled) {
    console.log('[scheduler] disabled (set CRON_ENABLED=true to enable)');
    return null;
  }
  const schedule = process.env.CRON_SCHEDULE || '0 8 * * *'; // 08:00 every day
  console.log(`[scheduler] starting with schedule: ${schedule}`);
  const task = cron.schedule(schedule, async () => {
    try {
      console.log('[scheduler] running notifications...');
      const res = await runNotifications();
      console.log('[scheduler] done', res.summary);
    } catch (e) {
      console.warn('[scheduler] error', e.message);
    }
  }, { timezone: process.env.CRON_TZ || 'Europe/Paris' });
  return task;
}

module.exports = { startScheduler };
