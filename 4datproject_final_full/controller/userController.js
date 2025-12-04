const User = require("../model/user");

exports.create = async (req, res) => {
  try {
    const u = await User.create(req.body);
    res.status(201).json(u);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.list = async (req, res) => {
  const list = await User.find();
  res.json(list);
};
