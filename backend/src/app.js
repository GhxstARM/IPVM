require('dotenv').config(); // Siempre primero, antes de cualquier módulo que use process.env

const express = require('express');
const cors = require('cors');
const pool = require('./config/db');

const multer = require('multer');
const Lens = require('chrome-lens-ocr').default || require('chrome-lens-ocr');
const { OpenAI } = require('openai');

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
  console.warn('⚠️  Falta SHEETS_WEBAPP_URL en el .env (no se guardará en Google Sheets)');
}

// Cliente apuntando a la API de Groq
const aiClient = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

// llama-3.3-70b-versatile fue dado de baja en Groq (16-08-2026).
// Usamos el modelo más barato de Groq para texto: openai/gpt-oss-20b
// ($0.075 / $0.30 por 1M tokens entrada/salida). Se puede cambiar desde el .env.
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

// Caché de 60 s para la página de Transparencia (Apps Script tarda 1-2 s en responder)
const CACHE_TRANSPARENCIA_MS = 60 * 1000;
let cacheTransparencia = { data: null, ts: 0 };

// Guarda un gasto en Google Sheets vía Apps Script (doPost).
// Lanza un Error si algo falla.
async function guardarEnSheets({ gasto, fecha, razon, monto }) {
  if (!process.env.SHEETS_WEBAPP_URL) {
    throw new Error('Falta SHEETS_WEBAPP_URL en el .env');
  }

  // Monto en CLP: "12.990" -> 12990 (evita que Sheets lo lea como 12,99)
  const digitos = String(monto ?? '').replace(/[^\d]/g, '');
  if (!digitos) {
    throw new Error(`Monto no válido: "${monto}"`);
  }

  const sheetsRes = await fetch(process.env.SHEETS_WEBAPP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      gasto: gasto || 'Otros',
      // Si no hay fecha válida, Apps Script usa la fecha de hoy
      fecha: fecha && fecha !== 'No detectado' ? fecha : '',
      razon: razon || 'No detectado',
      monto: Number(digitos),
    }),
    redirect: 'follow', // Apps Script responde con un 302 antes del resultado
  });

  const texto = await sheetsRes.text();
  let sheetsData;
  try {
    sheetsData = JSON.parse(texto);
  } catch {
    // Típico cuando la implementación no es pública y Google devuelve una página de login/HTML
    let host = '';
    try { host = new URL(sheetsRes.url).hostname; } catch {}
    const extracto = texto.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
    throw new Error(
      `Apps Script no devolvió JSON (HTTP ${sheetsRes.status}, respondió ${host}). ` +
        `Respuesta: "${extracto}". ` +
        'Revisa que la implementación sea "Aplicación web", acceso "Cualquier persona" y que la URL termine en /exec.'
    );
  }

  if (!sheetsData.success) {
    throw new Error(sheetsData.error || 'Apps Script devolvió success: false');
  }
}

app.post('/api/ocr', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No imagen' });

    // 1. Extraer texto con OCR
    const ocrResult = await lens.scanByBuffer(req.file.buffer);
    const extractedText = ocrResult.segments.map(s => s.text).join('\n');

    if (!extractedText) {
      return res.status(400).json({ success: false, error: 'No se detectó texto en la imagen' });
    }

    // 2. Procesar con Groq
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
      reasoning_effort: 'low', // gpt-oss razona; 'low' da respuestas rápidas y baratas
      response_format: { type: 'json_object' },
    });

    const rawContent = aiResponse.choices[0]?.message?.content || '';

    // 3. Limpiar y parsear (por si la IA añade marcas markdown)
    const cleanJson = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
    const analisisJson = JSON.parse(cleanJson);
    console.log('Análisis IA:', analisisJson, '| tokens:', aiResponse.usage?.total_tokens);

    // 4. Enviar resultado estructurado al frontend.
    // El guardado en Google Sheets ya no es automático: el usuario confirma/edita
    // los datos en el frontend y se suben con POST /api/gastos.
    res.json({
      success: true,
      text: extractedText,
      analisis: analisisJson,
    });
  } catch (error) {
    console.error('Error procesando OCR/Groq:', error?.status, error?.message || error);
    res.status(500).json({ success: false, error: 'Error procesando la boleta' });
  }
});

// Guardado manual (por si el frontend corrige los datos antes de confirmar)
// Body esperado: { gasto, fecha, razon, monto }
app.post('/api/gastos', async (req, res) => {
  try {
    await guardarEnSheets(req.body || {});
    cacheTransparencia.ts = 0; // fuerza a que Transparencia muestre el gasto nuevo
    res.json({ success: true });
  } catch (error) {
    console.error('Error guardando en Google Sheets:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Datos para la página de Transparencia: lee gastos e ingresos desde Google Sheets.
// El frontend NUNCA llama directo a Apps Script: esa URL también permite escribir en la hoja.
app.get('/api/transparencia', async (req, res) => {
  try {
    if (!process.env.SHEETS_WEBAPP_URL) {
      throw new Error('Falta SHEETS_WEBAPP_URL en el .env');
    }

    const ahora = Date.now();
    if (cacheTransparencia.data && ahora - cacheTransparencia.ts < CACHE_TRANSPARENCIA_MS) {
      return res.json(cacheTransparencia.data);
    }

    const url = new URL(process.env.SHEETS_WEBAPP_URL);
    url.searchParams.set('action', 'transparencia');

    const sheetsRes = await fetch(url, { redirect: 'follow' });
    if (!sheetsRes.ok) {
      throw new Error(`Apps Script respondió HTTP ${sheetsRes.status}`);
    }
    const texto = await sheetsRes.text();

    let data;
    try {
      data = JSON.parse(texto);
    } catch {
      throw new Error(`Apps Script no devolvió JSON (HTTP ${sheetsRes.status})`);
    }
    if (!data.success) {
      throw new Error(data.error || 'Apps Script devolvió success: false');
    }

    // Si faltan estos arrays, la URL /exec sigue ejecutando una versión antigua del script
    if (!Array.isArray(data.gastos) || !Array.isArray(data.ingresos)) {
      throw new Error(
        'Apps Script devolvió una versión antigua (sin gastos/ingresos). Crea una nueva versión de la implementación.'
      );
    }

    const payload = {
      success: true,
      gastos: data.gastos,
      ingresos: data.ingresos,
    };
    cacheTransparencia = { data: payload, ts: ahora };
    res.json(payload);
  } catch (error) {
    console.error('Error leyendo transparencia desde Google Sheets:', error.message);
    // Si hay una versión anterior en caché, es mejor mostrarla que un error
    if (cacheTransparencia.data) return res.json(cacheTransparencia.data);
    res.status(500).json({ success: false, error: 'No se pudieron cargar los datos de transparencia' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT} (modelo: ${GROQ_MODEL})`);
});