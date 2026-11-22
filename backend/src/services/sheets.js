/**
 * Cliente de Google Apps Script (la "base de datos" en Google Sheets).
 * Las variables de entorno se leen en cada llamada para no depender del orden de carga de dotenv.
 */

const ERROR_SIN_URL = 'Falta SHEETS_WEBAPP_URL en el .env';

function urlSheets() {
  const url = (process.env.SHEETS_WEBAPP_URL || '').trim();
  if (!url) throw new Error(ERROR_SIN_URL);
  return url;
}

/**
 * Envía un payload por POST al Apps Script y devuelve su respuesta ya validada.
 * Lanza un Error con el mensaje del script si `success` es falso.
 */
async function enviarASheets(payload) {
  const response = await fetch(urlSheets(), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    redirect: 'follow',
  });

  const texto = await response.text();
  let data;
  try {
    data = JSON.parse(texto);
  } catch {
    throw new Error(`Google Apps Script no devolvió JSON: ${texto.slice(0, 150)}`);
  }

  if (!data.success) {
    throw new Error(
      data.error || (response.ok ? 'Error en Google Apps Script' : `Apps Script respondió HTTP ${response.status}`)
    );
  }
  return data;
}

/** Operación CRUD de finanzas (gastos / ingresos) sobre la hoja de cálculo. */
function gestionarFinanzas({ type, operation, id, record }) {
  return enviarASheets({ action: 'gestion', type, operation, id, record });
}

/** Lee datos del Apps Script por GET. Devuelve la respuesta HTTP y el JSON parseado. */
async function leerDeSheets(action) {
  const url = new URL(urlSheets());
  url.searchParams.set('action', action);
  const response = await fetch(url, { redirect: 'follow' });
  const data = await response.json();
  return { response, data };
}

module.exports = { enviarASheets, gestionarFinanzas, leerDeSheets, ERROR_SIN_URL };
