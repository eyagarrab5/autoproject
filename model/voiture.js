const mongo = require("mongoose");
const schema = mongo.Schema;

const Voiture = new schema({
  mat: String,
  name: String,
  marque: String,
});
module.exports = mongo.model("voiture", Voiture);
