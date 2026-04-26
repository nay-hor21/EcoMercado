const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const Producto = require('./producto');  // ← sin carpeta models/

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Conexión MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Atlas conectado'))
  .catch(err => console.error('❌ Error:', err));

// RUTAS
// GET - obtener todos los productos
app.get('/api/productos', async (req, res) => {
  const productos = await Producto.find();
  res.json(productos);
});

// POST - crear producto
app.post('/api/productos', async (req, res) => {
  const nuevo = new Producto(req.body);
  await nuevo.save();
  res.status(201).json(nuevo);
});

// DELETE - eliminar producto
app.delete('/api/productos/:id', async (req, res) => {
  await Producto.findByIdAndDelete(req.params.id);
  res.json({ mensaje: 'Producto eliminado' });
});

app.listen(process.env.PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${process.env.PORT}`);
});