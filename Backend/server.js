const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();

const Producto = require('./producto');
const Usuario  = require('./usuario');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'ecomercado_jwt_secreto_123';

// ── CORS ─────────────────────────────────────────────────
const allowedOrigins = new Set([
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:5501',
  'http://127.0.0.1:5501',
  process.env.FRONTEND_ORIGIN,
]);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error(`CORS no permitido: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options(/.*/, cors());
app.use(express.json());

// ── SESIÓN ───────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'ecomercado_secreto_123',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 horas
}));

// ── MONGODB ──────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Atlas conectado'))
  .catch(err => console.error('❌ Error conectando MongoDB:', err.message));

// ── PASSPORT GOOGLE OAuth ────────────────────────────────
passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  'http://localhost:5000/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let usuario = await Usuario.findOne({ googleId: profile.id });
    if (!usuario) {
      // Si ya existe con ese email, vincula el googleId
      usuario = await Usuario.findOne({ email: profile.emails[0].value });
      if (usuario) {
        usuario.googleId = profile.id;
        await usuario.save();
      } else {
        // Usuario nuevo via Google
        usuario = await Usuario.create({
          nombre:   profile.displayName,
          email:    profile.emails[0].value,
          googleId: profile.id
        });
      }
    }
    return done(null, usuario);
  } catch (err) {
    return done(err, null);
  }
}));

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  const user = await Usuario.findById(id);
  done(null, user);
});

app.use(passport.initialize());
app.use(passport.session());

// ── MIDDLEWARE AUTH ──────────────────────────────────────
function verifyJwt(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.slice(7), JWT_SECRET);
  } catch {
    return null;
  }
}

function requireAuth(req, res, next) {
  if (req.session?.usuarioId) return next();
  const payload = verifyJwt(req);
  if (payload) { req.user = payload; return next(); }
  res.status(401).json({ error: 'No autenticado. Inicia sesión.' });
}

// ── RUTAS GOOGLE OAuth ───────────────────────────────────
app.get('/api/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/api/auth/google/callback',
  passport.authenticate('google', { failureRedirect: 'http://localhost:5501/Frontend/login.html' }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id, nombre: req.user.nombre, email: req.user.email },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.redirect(
      `http://localhost:5501/Frontend/index.html?token=${token}&nombre=${encodeURIComponent(req.user.nombre)}`
    );
  }
);

// ── RUTAS AUTENTICACIÓN ──────────────────────────────────
app.post('/api/registro', async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    const existe = await Usuario.findOne({ email });
    if (existe) return res.status(400).json({ error: 'El email ya está registrado' });
    const hash = await bcrypt.hash(password, 10);
    await new Usuario({ nombre, email, password: hash }).save();
    res.status(201).json({ mensaje: 'Usuario registrado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(401).json({ error: 'Credenciales incorrectas' });
    const valida = await bcrypt.compare(password, usuario.password);
    if (!valida) return res.status(401).json({ error: 'Credenciales incorrectas' });
    req.session.usuarioId = usuario._id;
    req.session.nombre    = usuario.nombre;
    const token = jwt.sign(
      { id: usuario._id, nombre: usuario.nombre, email: usuario.email },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({
      mensaje: `Bienvenido, ${usuario.nombre}`,
      token,
      usuario: { id: usuario._id, nombre: usuario.nombre, email: usuario.email }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ mensaje: 'Sesión cerrada' });
});

app.get('/api/sesion', (req, res) => {
  if (req.session?.usuarioId) {
    return res.json({ autenticado: true, nombre: req.session.nombre, via: 'session' });
  }
  const payload = verifyJwt(req);
  if (payload) {
    return res.json({ autenticado: true, nombre: payload.nombre, via: 'jwt' });
  }
  res.json({ autenticado: false });
});

// ── RUTAS PRODUCTOS ──────────────────────────────────────
app.get('/api/productos', async (req, res) => {
  try {
    const productos = await Producto.find();
    res.json(productos);
  } catch {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

app.post('/api/productos', requireAuth, async (req, res) => {
  try {
    const nuevo = new Producto(req.body);
    await nuevo.save();
    res.status(201).json(nuevo);
  } catch {
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

app.delete('/api/productos/:id', requireAuth, async (req, res) => {
  try {
    await Producto.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Producto eliminado' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

// ── INICIAR SERVIDOR ─────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
});