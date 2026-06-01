 # EcoMercado — Del Campo a Tu Mesa

Plataforma de comercio electrónico que conecta directamente a productores agrícolas locales con consumidores, eliminando intermediarios para lograr precios más justos y productos más frescos.

---

##  Estructura del Proyecto

```
EcoMercado/
├── Frontend/
│   ├── login.html        → Página de bienvenida
│   ├── inicio.html       → Formulario de inicio de sesión
│   ├── Registro.html     → Formulario de registro
│   ├── index.html        → Tienda principal (pública)
│   └── carritoo.html     → Carrito de compras (protegido)
└── Backend/
    ├── server.js         → Servidor principal (Express)
    ├── usuario.js        → Modelo de usuario (Mongoose)
    ├── producto.js       → Modelo de producto (Mongoose)
    ├── package.json      → Dependencias del proyecto
    └── .env              → Variables de entorno (no incluido en el repo)
```

---

##  Tecnologías Utilizadas

| Tecnología | Uso |
|---|---|
| HTML, CSS, JavaScript | Frontend sin frameworks |
| Node.js + Express | Servidor backend |
| MongoDB Atlas + Mongoose | Base de datos en la nube |
| JWT (jsonwebtoken) | Autenticación por token |
| bcrypt | Encriptación de contraseñas |
| Passport.js + Google OAuth 2.0 | Autenticación con Google |
| CORS | Control de acceso entre puertos |

---

##  Cómo ejecutar el proyecto

### 1. Instalar dependencias
```bash
cd Backend
npm install
```

### 2. Configurar variables de entorno
Crear un archivo `.env` dentro de `Backend/` con:
```
MONGO_URI=tu_cadena_de_conexion_mongodb
GOOGLE_CLIENT_ID=tu_client_id_de_google
GOOGLE_CLIENT_SECRET=tu_client_secret_de_google
JWT_SECRET=tu_clave_secreta
SESSION_SECRET=tu_secreto_de_sesion
FRONTEND_ORIGIN=http://localhost:5500
```

### 3. Iniciar el servidor
```bash
node server.js
```

### 4. Abrir el frontend
Abrir `Frontend/login.html` con Live Server en VS Code (puerto 5500 o 5501).

---

##  Flujo de Autenticación

```
REGISTRO:
  Usuario llena el formulario
  → bcrypt.hash(password, 10)
  → Guardar en MongoDB
  → Redirige al login

LOGIN CON CORREO:
  Usuario ingresa credenciales
  → findOne({ email }) en MongoDB
  → bcrypt.compare(password, hash)
  → jwt.sign({ id, nombre }, secreto, { expiresIn: '8h' })
  → Token guardado en localStorage
  → Redirige a index.html

LOGIN CON GOOGLE:
  Usuario hace clic en "Continuar con Google"
  → Passport redirige a Google OAuth
  → Google autentica y retorna perfil
  → Servidor crea o vincula la cuenta en MongoDB
  → Genera JWT y redirige al frontend con token en URL

PÁGINAS PROTEGIDAS:
  Al cargar carritoo.html
  → Verifica token en localStorage
  → Decodifica con atob() + JSON.parse()
  → Si expiró o no existe → redirige al login
  → Si es válido → muestra el contenido
```

---

## Principios de Accesibilidad Web (WCAG)

El proyecto EcoMercado aplica los 4 principios fundamentales de accesibilidad definidos por las WCAG:

---

### 1.  Perceptible
*La información debe ser presentable de formas que los usuarios puedan percibir.*

- Todas las imágenes tienen atributo `alt` descriptivo para lectores de pantalla.
  ```html
  <img src="brocoli.jpg" alt="Brócoli Orgánico">
  ```
- Se usa `lang="es"` en la etiqueta `<html>` para que los lectores de pantalla identifiquen el idioma correctamente.
- Los colores de texto y fondo tienen contraste suficiente — texto oscuro `#0d2818` sobre fondos claros `#fdf8ee`.
- El diseño es **responsive** con `meta viewport` y media queries, adaptándose a pantallas de cualquier tamaño.
- Los mensajes de error y éxito no dependen solo del color — también incluyen texto e íconos descriptivos (⚠️ ✅ ❌).
- `<meta charset="UTF-8">` garantiza que caracteres especiales (tildes, ñ) sean interpretados correctamente.

---

### 2.  Operable
*Los componentes de la interfaz deben ser operables.*

- Todos los botones y enlaces son accesibles desde el **teclado** — el formulario de login responde a la tecla `Enter`:
  ```js
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter') iniciarSesion();
  });
  ```
- Los botones tienen estados visuales claros: normal, `:hover` y `:disabled`, informando al usuario qué está pasando.
- El botón de login se **deshabilita** mientras procesa la solicitud, evitando múltiples envíos accidentales.
- Los enlaces de navegación son elementos `<a>` reales, no divs con onClick, lo que garantiza navegación por teclado y compatibilidad con lectores de pantalla.
- La barra de navegación es `sticky` (fija al hacer scroll) para que los controles principales siempre estén accesibles.
- Los inputs tienen `autocomplete` configurado correctamente (`email`, `current-password`, `new-password`) para facilitar el autocompletado.

---

### 3.  Comprensible
*La información y el manejo de la interfaz debe ser comprensible.*

- Los mensajes de error son **específicos y en español**, indicando exactamente qué campo falló y por qué:
  - "Ingresa tu correo electrónico"
  - "Las contraseñas no coinciden. Verifícalas."
  - "El email ya está registrado"
- Los campos del formulario tienen `<label>` asociado correctamente a cada `<input>` con `for` e `id`.
- Los inputs con error se resaltan visualmente en rojo con animación de sacudida, orientando la atención del usuario al problema.
- Los botones describen claramente su acción: "Iniciar sesión", "Crear cuenta", "Salir".
- El flujo de la aplicación es predecible: bienvenida → login → tienda → carrito, sin saltos confusos.
- El carrito redirige automáticamente al login si el usuario no está autenticado, con una razón implícita clara.
- Mientras se procesa una solicitud, el botón cambia su texto a "Ingresando…" o "Creando cuenta…" para informar que algo está ocurriendo.

---

### 4.  Robusto
*El contenido debe ser robusto para ser interpretado por una amplia variedad de agentes de usuario.*

- Se utiliza HTML semántico estándar: `<nav>`, `<section>`, `<footer>`, `<button>`, `<form>`, `<label>`, garantizando compatibilidad con distintos navegadores y tecnologías asistivas.
- El `<!DOCTYPE html>` está correctamente declarado en todos los archivos, evitando que los navegadores entren en modo quirks.
- Las imágenes tienen `onerror` para manejar fallos de carga sin romper la interfaz:
  ```html
  <img src="logoo.png" onerror="this.style.display='none'">
  ```
- El guard de autenticación usa `try/catch` para manejar tokens malformados sin romper la página:
  ```js
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
  } catch(e) {
    localStorage.removeItem('eco_token');
  }
  ```
- El backend maneja todos los errores con códigos HTTP correctos (400, 401, 500) y mensajes JSON estructurados, garantizando que cualquier cliente pueda interpretar las respuestas.
- Las fuentes se cargan desde Google Fonts con la etiqueta `<link rel="preconnect">` para optimizar la carga, y el sistema usa fuentes del sistema como fallback si Google Fonts no carga.

---
