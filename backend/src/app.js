require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const Lens = require('chrome-lens-ocr').default || require('chrome-lens-ocr');
const { OpenAI } = require('openai');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});
const lens = new Lens();

if (!process.env.GROQ_API_KEY) {
  console.warn('⚠️  Falta GROQ_API_KEY en el .env');
}
if (!process.env.SHEETS_WEBAPP_URL) {
  console.warn('⚠️  Falta SHEETS_WEBAPP_URL en el .env');
}

const aiClient = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

const CACHE_TRANSPARENCIA_MS = 60 * 1000;
// Cambia esta constante si quieres usar otra contraseña de Secretaría.
const SECRETARIA_PASSWORD = 'admin123';
let cacheTransparencia = { data: null, ts: 0 };
const sesionesSecretaria = new Map();

function requiereSecretaria(req, res, next) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const vence = sesionesSecretaria.get(token);
  if (!token || !vence || vence <= Date.now()) {
    sesionesSecretaria.delete(token);
    return res.status(401).json({ success: false, error: 'Sesión de secretaría inválida o vencida.' });
  }
  next();
}

app.post('/api/secretaria/login', (req, res) => {
  const enviada = Buffer.from(String(req.body?.password || ''));
  const esperada = Buffer.from(SECRETARIA_PASSWORD);
  if (enviada.length !== esperada.length || !crypto.timingSafeEqual(enviada, esperada)) {
    return res.status(401).json({ success: false, error: 'Contraseña incorrecta.' });
  }
  const token = crypto.randomBytes(32).toString('hex');
  sesionesSecretaria.set(token, Date.now() + 12 * 60 * 60 * 1000);
  res.json({ success: true, token });
});

app.post('/api/secretaria/logout', requiereSecretaria, (req, res) => {
  sesionesSecretaria.delete(String(req.headers.authorization).replace(/^Bearer\s+/i, ''));
  res.json({ success: true });
});

async function solicitarSheets({ action, type, operation, id, record }) {
  if (!process.env.SHEETS_WEBAPP_URL) throw new Error('Falta SHEETS_WEBAPP_URL en el .env');
  const response = await fetch(process.env.SHEETS_WEBAPP_URL, {
    method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, type, operation, id, record }), redirect: 'follow',
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.error || `Apps Script respondió HTTP ${response.status}`);
  return data;
}

app.get('/api/finanzas', requiereSecretaria, async (req, res) => {
  try {
    const url = new URL(process.env.SHEETS_WEBAPP_URL);
    url.searchParams.set('action', 'gestion');
    const response = await fetch(url, { redirect: 'follow' });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error || 'No se pudieron leer las hojas.');
    res.json({ gastos: data.gastos || [], ingresos: data.ingresos || [] });
  } catch (error) { res.status(502).json({ success: false, error: error.message }); }
});

app.post('/api/finanzas/:tipo', requiereSecretaria, async (req, res) => {
  if (!['gastos', 'ingresos'].includes(req.params.tipo)) return res.status(400).json({ success: false, error: 'Tipo de registro inválido.' });
  try {
    const data = await solicitarSheets({ action: 'gestion', type: req.params.tipo, operation: 'create', record: req.body });
    cacheTransparencia.ts = 0;
    res.json(data);
  } catch (error) { res.status(400).json({ success: false, error: error.message }); }
});

app.put('/api/finanzas/:tipo/:id', requiereSecretaria, async (req, res) => {
  if (!['gastos', 'ingresos'].includes(req.params.tipo)) return res.status(400).json({ success: false, error: 'Tipo de registro inválido.' });
  try {
    const data = await solicitarSheets({ action: 'gestion', type: req.params.tipo, operation: 'update', id: req.params.id, record: req.body });
    cacheTransparencia.ts = 0;
    res.json(data);
  } catch (error) { res.status(400).json({ success: false, error: error.message }); }
});

app.delete('/api/finanzas/:tipo/:id', requiereSecretaria, async (req, res) => {
  if (!['gastos', 'ingresos'].includes(req.params.tipo)) return res.status(400).json({ success: false, error: 'Tipo de registro inválido.' });
  try {
    const data = await solicitarSheets({ action: 'gestion', type: req.params.tipo, operation: 'delete', id: req.params.id });
    cacheTransparencia.ts = 0;
    res.json(data);
  } catch (error) { res.status(400).json({ success: false, error: error.message }); }
});

const SHEETS_URL = (process.env.SHEETS_WEBAPP_URL || '').trim();

// Helper genérico para peticiones POST a Google Apps Script
async function enviarASheets(payload) {
  if (!SHEETS_URL) {
    throw new Error('Falta SHEETS_WEBAPP_URL en el .env');
  }

  const sheetsRes = await fetch(SHEETS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    redirect: 'follow',
  });

  const texto = await sheetsRes.text();
  let data;
  try {
    data = JSON.parse(texto);
  } catch {
    throw new Error(`Google Apps Script no devolvió JSON: ${texto.slice(0, 150)}`);
  }

  if (!data.success) {
    throw new Error(data.error || 'Error en Google Apps Script');
  }
  return data;
}

// ----------------- OCR Y BOLETAS -----------------
app.post('/api/ocr', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No imagen' });

    const ocrResult = await lens.scanByBuffer(req.file.buffer);
    const extractedText = ocrResult.segments.map((s) => s.text).join('\n');

    if (!extractedText) {
      return res.status(400).json({ success: false, error: 'No se detectó texto en la imagen' });
    }

    const aiResponse = await aiClient.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'Eres un extractor de datos contables. Lee el texto OCR de la boleta y devuelve ÚNICAMENTE un JSON válido con esta estructura exacta: {"gasto": "Categoría", "fecha": "DD-MM-YYYY", "razon": "Nombre del comercio o motivo", "monto": "Monto numérico sin símbolos"}. "gasto" debe ser UNA de estas categorías: Alimentación, Transporte, Salud, Servicios básicos, Hogar, Entretenimiento, Educación, Trabajo, Otros. Si no encuentras un dato, pon "No detectado".',
        },
        {
          role: 'user',
          content: `Texto OCR:\n${extractedText}`,
        },
      ],
      temperature: 0.1,
      reasoning_effort: 'low',
      response_format: { type: 'json_object' },
    });

    const rawContent = aiResponse.choices[0]?.message?.content || '';
    const cleanJson = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
    const analisisJson = JSON.parse(cleanJson);

    res.json({
      success: true,
      text: extractedText,
      analisis: analisisJson,
    });
  } catch (error) {
    console.error('Error procesando OCR/Groq:', error?.message || error);
    res.status(500).json({ success: false, error: 'Error procesando la boleta' });
  }
});


// Guardado manual (por si el frontend corrige los datos antes de confirmar)
// Body esperado: { gasto, fecha, razon, monto }
app.post('/api/gastos', requiereSecretaria, async (req, res) => {

app.post('/api/gastos', async (req, res) => {

  try {
    const { gasto, fecha, razon, monto } = req.body || {};
    const digitos = String(monto ?? '').replace(/[^\d]/g, '');
    if (!digitos) throw new Error(`Monto no válido: "${monto}"`);

    await enviarASheets({
      tipo: 'gasto',
      gasto: gasto || 'Otros',
      fecha: fecha && fecha !== 'No detectado' ? fecha : '',
      razon: razon || 'No detectado',
      monto: Number(digitos),
    });

    cacheTransparencia.ts = 0; // refresca transparencia
    res.json({ success: true });
  } catch (error) {
    console.error('Error guardando gasto:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------- TRANSPARENCIA -----------------
app.get('/api/transparencia', async (req, res) => {
  try {
    if (!SHEETS_URL) {
      throw new Error('Falta SHEETS_WEBAPP_URL en el .env');
    }

    const ahora = Date.now();
    if (cacheTransparencia.data && ahora - cacheTransparencia.ts < CACHE_TRANSPARENCIA_MS) {
      return res.json(cacheTransparencia.data);
    }

    const url = new URL(SHEETS_URL);
    url.searchParams.set('action', 'transparencia');

    const sheetsRes = await fetch(url, { redirect: 'follow' });
    const data = await sheetsRes.json();

    if (!data.success) throw new Error(data.error || 'Error al obtener transparencia');

    const payload = {
      success: true,
      gastos: data.gastos || [],
      ingresos: data.ingresos || [],
    };
    cacheTransparencia = { data: payload, ts: ahora };
    res.json(payload);
  } catch (error) {
    console.error('Error leyendo transparencia:', error.message);
    if (cacheTransparencia.data) return res.json(cacheTransparencia.data);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------- MENSAJE PASTORAL -----------------
app.get('/api/pastoral', async (req, res) => {
  try {
    if (!SHEETS_URL) throw new Error('Falta SHEETS_WEBAPP_URL en el .env');
    const url = new URL(SHEETS_URL);
    url.searchParams.set('action', 'pastor');

    const sheetsRes = await fetch(url, { redirect: 'follow' });
    const data = await sheetsRes.json();

    res.json({
      success: true,
      mensaje: data.data?.mensaje || '',
    });
  } catch (error) {
    console.error('Error leyendo mensaje pastoral:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/pastoral', async (req, res) => {
  try {
    const { mensaje } = req.body || {};
    await enviarASheets({ tipo: 'pastor', mensaje: mensaje || '' });
    res.json({ success: true });
  } catch (error) {
    console.error('Error guardando mensaje pastoral:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------- EVENTOS -----------------
function formatearFecha(val) {
  if (!val) return '';
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const d = new Date(val);
  if (isNaN(d.getTime())) return str;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatearHora(val) {
  if (!val) return '';
  const str = String(val).trim();
  if (/^\d{1,2}:\d{2}$/.test(str)) return str;
  const d = new Date(val);
  if (isNaN(d.getTime())) return str;
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

app.get('/api/eventos', async (req, res) => {
  try {
    if (!SHEETS_URL) throw new Error('Falta SHEETS_WEBAPP_URL en el .env');
    const url = new URL(SHEETS_URL);
    url.searchParams.set('action', 'eventos');

    const sheetsRes = await fetch(url, { redirect: 'follow' });
    const data = await sheetsRes.json();

    const rawEventos = data.eventos || [];
    const eventos = rawEventos.map((ev) => ({
      ...ev,
      fecha: formatearFecha(ev.fecha),
      hora: formatearHora(ev.hora),
    }));

    res.json(eventos);
  } catch (error) {
    console.error('Error leyendo eventos:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/eventos', async (req, res) => {
  try {
    const { titulo, fecha, hora, descripcion } = req.body || {};
    const result = await enviarASheets({
      tipo: 'evento',
      titulo,
      fecha,
      hora,
      descripcion,
    });
    res.json({ success: true, id: result.id, titulo, fecha, hora, descripcion });
  } catch (error) {
    console.error('Error guardando evento:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/eventos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await enviarASheets({ tipo: 'eliminar_evento', id });
    res.json({ success: true });
  } catch (error) {
    console.error('Error eliminando evento:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT} (modelo: ${GROQ_MODEL})`);
});
