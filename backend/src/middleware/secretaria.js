const crypto = require('crypto');

const DURACION_SESION_MS = 12 * 60 * 60 * 1000;
const LIMPIEZA_INTERVALO_MS = 60 * 60 * 1000;
const PASSWORD_POR_DEFECTO = 'admin123';

/** token -> instante (ms) en que vence la sesión */
const sesiones = new Map();

function passwordEsperada() {
  return process.env.SECRETARIA_PASSWORD || PASSWORD_POR_DEFECTO;
}

function usaPasswordPorDefecto() {
  return !process.env.SECRETARIA_PASSWORD;
}

function extraerToken(req) {
  return String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
}

/** Compara la contraseña enviada en tiempo constante. */
function passwordValida(enviadaTexto) {
  const enviada = Buffer.from(String(enviadaTexto || ''));
  const esperada = Buffer.from(passwordEsperada());
  return enviada.length === esperada.length && crypto.timingSafeEqual(enviada, esperada);
}

function abrirSesion() {
  const token = crypto.randomBytes(32).toString('hex');
  sesiones.set(token, Date.now() + DURACION_SESION_MS);
  return token;
}

function cerrarSesion(token) {
  sesiones.delete(token);
}

/** Middleware: exige un token de sesión de Secretaría vigente. */
function requiereSecretaria(req, res, next) {
  const token = extraerToken(req);
  const vence = sesiones.get(token);
  if (!token || !vence || vence <= Date.now()) {
    sesiones.delete(token);
    return res.status(401).json({ success: false, error: 'Sesión de secretaría inválida o vencida.' });
  }
  next();
}

// Evita que las sesiones vencidas se acumulen en memoria.
setInterval(() => {
  const ahora = Date.now();
  for (const [token, vence] of sesiones) {
    if (vence <= ahora) sesiones.delete(token);
  }
}, LIMPIEZA_INTERVALO_MS).unref();

module.exports = {
  requiereSecretaria,
  extraerToken,
  passwordValida,
  abrirSesion,
  cerrarSesion,
  usaPasswordPorDefecto,
};
