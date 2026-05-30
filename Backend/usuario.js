const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
  nombre:   { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String }, // opcional: Google no usa password
  googleId: { type: String } // nuevo
}, { timestamps: true });

module.exports = mongoose.model('Usuario', UsuarioSchema);