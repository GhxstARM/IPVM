require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const Lens = require('chrome-lens-ocr').default || require('chrome-lens-ocr');
const { OpenAI } = require('openai');
const crypto = require('crypto');
const {
  WebpayPlus,
  Options,
  IntegrationApiKeys,
  IntegrationCommerceCodes,
  Environment,
} = require('transbank-sdk');



const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// ----------------- WEBPAY PLUS (DONACIONES) -----------------
const txWebpay = new WebpayPlus.Transaction(
  new Options(
    IntegrationCommerceCodes.WEBPAY_PLUS, // Código de comercio de prueba: 597055555532
    IntegrationApiKeys.WEBPAY,            // API Key pública de integración
    Environment.Integration               // Apunta a webpay3gint.transbank.cl
  )
);

function obtenerUrlsBase(req) {
  const backend = (process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  const frontend = (process.env.FRONTEND_URL || `${req.protocol}://${req.hostname}:5173`).replace(/\/$/, '');
  return { backend, frontend };
}

// 1A-1. Pantalla móvil al escanear el QR para que el donante elija el monto
app.get('/api/webpay/qr', (req, res) => {
  const montoInicial = Math.round(Number(req.query?.monto)) >= 500 ? Math.round(Number(req.query.monto)) : '';

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Donar - Ministerio PVM</title>
    <style>
      body { font-family: system-ui, -apple-system, sans-serif; background: #fafaf9; color: #292524; margin: 0; padding: 1.25rem; display: flex; justify-content: center; align-items: center; min-height: 100vh; box-sizing: border-box; }
      .card { background: #fff; width: 100%; max-width: 380px; border-radius: 1.25rem; box-shadow: 0 10px 25px rgba(0,0,0,0.08); overflow: hidden; border: 1px solid #e7e5e4; }
      .header { background: #b45309; color: #fff; padding: 1.25rem 1.5rem; }
      .header small { color: #fde68a; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; font-size: 0.7rem; }
      .header h1 { margin: 0.25rem 0 0; font-size: 1.25rem; }
      .body { padding: 1.5rem; }
      .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin-bottom: 1rem; }
      .chip { background: #fffbeb; border: 1px solid #fcd34d; color: #92400e; font-weight: 700; padding: 0.65rem; border-radius: 0.75rem; cursor: pointer; font-size: 0.95rem; }
      .chip:active { background: #b45309; color: #fff; }
      label { display: block; font-size: 0.8rem; font-weight: 600; color: #57534e; margin-bottom: 0.4rem; }
      input { width: 100%; box-sizing: border-box; padding: 0.8rem 1rem; font-size: 1.1rem; font-weight: 700; border: 1px solid #d6d3d1; border-radius: 0.75rem; margin-bottom: 1rem; }
      button[type="submit"] { width: 100%; background: #1c1917; color: #fff; border: none; padding: 0.9rem; border-radius: 0.75rem; font-size: 1rem; font-weight: 700; cursor: pointer; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="header">
        <small>Ministerio PVM</small>
        <h1>Aporte Comunitario</h1>
      </div>
      <form class="body" method="POST" action="/api/webpay/qr">
        <label>Elige un monto sugerido</label>
        <div class="grid">
          <button type="button" class="chip" onclick="document.getElementById('monto').value=1000">$1.000</button>
          <button type="button" class="chip" onclick="document.getElementById('monto').value=2000">$2.000</button>
          <button type="button" class="chip" onclick="document.getElementById('monto').value=5000">$5.000</button>
          <button type="button" class="chip" onclick="document.getElementById('monto').value=10000">$10.000</button>
        </div>
        <label for="monto">O ingresa el monto que desees (mín. $500)</label>
        <input id="monto" name="monto" type="number" min="500" step="100" required placeholder="Ej: 1500" value="${montoInicial}" />
        <button type="submit">Continuar a Webpay</button>
      </form>
    </div>
  </body>
</html>`);
});

// 1A-2. Procesa el monto elegido y redirige a Transbank
app.post('/api/webpay/qr', async (req, res) => {
  try {
    const monto = Math.round(Number(req.body?.monto));
    if (!monto || monto < 500) {
      return res.status(400).send('El monto mínimo de donación es $500.');
    }

    const { backend } = obtenerUrlsBase(req);
    const buyOrder = `DON-${Date.now()}`;
    const sessionId = `SES-${crypto.randomBytes(8).toString('hex')}`;
    const returnUrl = `${backend}/api/webpay/retorno`;

    const response = await txWebpay.create(buyOrder, sessionId, monto, returnUrl);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html lang="es">
  <head><meta charset="UTF-8" /><title>Conectando con Webpay...</title></head>
  <body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
    <p>Conectando con Webpay Transbank ($${monto.toLocaleString('es-CL')})...</p>
    <form id="tbk-form" method="POST" action="${response.url}">
      <input type="hidden" name="token_ws" value="${response.token}" />
    </form>
    <script>document.getElementById('tbk-form').submit();</script>
  </body>
</html>`);
  } catch (error) {
    console.error('Error iniciando QR Webpay:', error);
    res.status(500).send('No se pudo conectar con Webpay Transbank.');
  }
});

// 1B. Acceso desde el botón del formulario en la web
app.post('/api/webpay/crear', async (req, res) => {
  try {
    const monto = Math.round(Number(req.body?.monto));
    if (!monto || monto < 500) {
      return res.status(400).json({ success: false, error: 'El monto mínimo de donación es $500.' });
    }

    const { backend } = obtenerUrlsBase(req);
    const buyOrder = `DON-${Date.now()}`;
    const sessionId = `SES-${crypto.randomBytes(8).toString('hex')}`;
    const returnUrl = `${backend}/api/webpay/retorno`;

    const response = await txWebpay.create(buyOrder, sessionId, monto, returnUrl);

    res.json({
      success: true,
      url: response.url,
      token: response.token,
    });
  } catch (error) {
    console.error('Error creando transacción Webpay:', error);
    res.status(500).json({ success: false, error: 'No se pudo iniciar el pago con Webpay.' });
  }
});

// 2. Transbank redirige el navegador del donante aquí al finalizar o anular el pago
app.all('/api/webpay/retorno', async (req, res) => {
  const { frontend } = obtenerUrlsBase(req);

  try {
    const tokenWs = req.body?.token_ws || req.query?.token_ws;
    const tbkToken = req.body?.TBK_TOKEN || req.query?.TBK_TOKEN;

    if (!tokenWs && tbkToken) {
      return res.redirect(`${frontend}/?estado=anulada`);
    }

    if (!tokenWs) {
      return res.redirect(`${frontend}/?estado=error`);
    }

    const resultado = await txWebpay.commit(tokenWs);

    if (resultado.status === 'AUTHORIZED' && resultado.response_code === 0) {
      try {
        const hoy = new Date().toISOString().split('T')[0];
        await solicitarSheets({
          action: 'gestion',
          type: 'ingresos',
          operation: 'create',
          record: {
            fecha: hoy,
            concepto: `Donación Webpay (${resultado.buy_order})`,
            monto: resultado.amount,
          },
        });
        cacheTransparencia.ts = 0;
      } catch (sheetErr) {
        console.error('Donación aprobada, pero falló el registro en Sheets:', sheetErr.message);
      }

      return res.redirect(
        `${frontend}/?estado=aprobada&monto=${resultado.amount}&orden=${resultado.buy_order}`
      );
    }

    return res.redirect(`${frontend}/?estado=rechazada`);
  } catch (error) {
    console.error('Error confirmando transacción Webpay:', error);
    return res.redirect(`${frontend}/?estado=error`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT} (modelo: ${GROQ_MODEL})`);
});
