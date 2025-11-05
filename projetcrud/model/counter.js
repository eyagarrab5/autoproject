const mongoose = require('mongoose');
const schema = mongoose.Schema;

// Simple counter collection to support auto-increment sequences
// Documents look like: { _id: 'voiture', seq: 1 }
const CounterSchema = new schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
}, { versionKey: false });

module.exports = mongoose.model('counter', CounterSchema);
