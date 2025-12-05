
const mongoose = require('mongoose');
const schema = mongoose.Schema;

// définition du schéma
const UserSchema = new schema({
    username: String,
    email: String,
    cin: Number
});

// export du modèle
module.exports = mongoose.model('user', UserSchema);
