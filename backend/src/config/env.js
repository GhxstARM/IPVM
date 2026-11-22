require('dotenv').config();

const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
const PORT = process.env.PORT || 3000;

/** Avisa por consola de las variables de entorno que faltan o usan valores por defecto. */
function advertirConfiguracion({ usaPasswordPorDefecto }) {
  if (!process.env.GROQ_API_KEY) {
    console.warn('⚠️  Falta GROQ_API_KEY en el .env');
  }
  if (!process.env.SHEETS_WEBAPP_URL) {
    console.warn('⚠️  Falta SHEETS_WEBAPP_URL en el .env');
  }
  if (usaPasswordPorDefecto) {
    console.warn('⚠️  Usando la contraseña de Secretaría por defecto: define SECRETARIA_PASSWORD en el .env');
  }
}

module.exports = { GROQ_MODEL, PORT, advertirConfiguracion };
