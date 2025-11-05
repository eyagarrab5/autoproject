const mongoose = require('mongoose');

function toStr(d) {
  if (!d) return d;
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const da = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
}

(async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/dbdata');
    const db = mongoose.connection.db;

    // Convert voitures: createdAt/updatedAt to strings if not already
    const voitures = db.collection('voitures');
    const vCursor = voitures.find({ $or: [
      { createdAt: { $type: 'date' } },
      { updatedAt: { $type: 'date' } }
    ]});
    while (await vCursor.hasNext()) {
      const doc = await vCursor.next();
      const createdAt = typeof doc.createdAt === 'string' ? doc.createdAt : toStr(doc.createdAt);
      const updatedAt = typeof doc.updatedAt === 'string' ? doc.updatedAt : toStr(doc.updatedAt);
      await voitures.updateOne({ _id: doc._id }, { $set: { createdAt, updatedAt } });
    }

    // Convert entretiens: date/createdAt/updatedAt to strings if not already
    const ents = db.collection('entretiens');
    const eCursor = ents.find({ $or: [
      { date: { $type: 'date' } },
      { createdAt: { $type: 'date' } },
      { updatedAt: { $type: 'date' } }
    ]});
    while (await eCursor.hasNext()) {
      const doc = await eCursor.next();
      const date = typeof doc.date === 'string' ? doc.date : toStr(doc.date);
      const createdAt = typeof doc.createdAt === 'string' ? doc.createdAt : toStr(doc.createdAt);
      const updatedAt = typeof doc.updatedAt === 'string' ? doc.updatedAt : toStr(doc.updatedAt);
      await ents.updateOne({ _id: doc._id }, { $set: { date, createdAt, updatedAt } });
    }

    console.log('Migration completed');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
