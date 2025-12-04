const Voiture = require("../model/voiture");

exports.create = async (req, res) => {
  try {
    const v = await Voiture.create(req.body);
    res.status(201).json(v);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.list = async (req, res) => {
  const list = await Voiture.find();
  res.json(list);
};

exports.get = async (req, res) => {
  const v = await Voiture.findById(req.params.id);
  if (!v) return res.status(404).json({ error: "Voiture non trouvée" });
  res.json(v);
};

exports.delete = async (req, res) => {
  await Voiture.findByIdAndDelete(req.params.id);
  res.json({ deleted: true });
};
