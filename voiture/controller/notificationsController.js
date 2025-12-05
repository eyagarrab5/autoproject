const { previewNotifications, runNotifications } = require('../services/notifier');

async function preview(req, res) {
  try {
    const data = await previewNotifications();
    res.status(200).json(data);
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function run(req, res) {
  try {
    const data = await runNotifications();
    res.status(200).json(data);
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { preview, run };
