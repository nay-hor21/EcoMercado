const mongoose = require('mongoose');

const ProductoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  precio: { type: Number, required: true },
  descripcion: { type: String },
  imagen: { type: String },
  categoria: { type: String },
  stock: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Producto', ProductoSchema);