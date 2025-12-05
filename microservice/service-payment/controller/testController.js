const User = require("../model/user");

async function add(req, res) {
  try {
    const user = new User(req.body);
    user.save();
    res.status(200).json(user);
  } catch (err) {
    console.log(err);
  }
}

async function showuser(req, res) {
  try {
    const user = await User.find();
    res.status(200).json(user);
  } catch (err) {
    console.log(err);
  }
}

async function showuserbyid(req, res) {
  try {
    const user = await User.findById(req.params.id);
    res.status(200).json(user);
  } catch (err) {
    console.log(err);
  }
}

async function showuserbyusername(req, res) {
  try {
    const user = await User.findOne({ username: req.params.username });
    res.status(200).json(user);
  } catch (err) {
    console.log(err);
  }
}

async function showAllusername(req, res) {
  try {
    const user = await User.find({ username: req.params.username });
    res.status(200).json(user);
  } catch (err) {
    console.log(err);
  }
}

async function deleteuser(req, res) {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).send("user deleted");
  } catch (err) {
    console.log(err);
  }
}

async function updateuser(req, res) {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json(user);
  } catch (err) {
    console.log(err);
  }
}
module.exports = {
  add,
  showuser,
  showuserbyid,
  showuserbyusername,
  showAllusername,
  deleteuser,
  updateuser,
};
