const { Router } = require('express');
const multer = require('multer');
const Lens = require('chrome-lens-ocr').default || require('chrome-lens-ocr');
const { OpenAI } = require('openai');
const { GROQ_MODEL } = require('../config/env');

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});
const lens = new Lens();

const aiClient = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

const PROMPT_SISTEMA =
  'Eres un extractor de datos contables. Lee el texto OCR de la boleta y devuelve ÚNICAMENTE un JSON válido con esta estructura exacta: {"gasto": "Categoría", "fecha": "DD-MM-YYYY", "razon": "Nombre del comercio o motivo", "monto": "Monto numérico sin símbolos"}. "gasto" debe ser UNA de estas categorías: Alimentación, Transporte, Salud, Servicios básicos, Hogar, Entretenimiento, Educación, Trabajo, Otros. Si no encuentras un dato, pon "No detectado".';

router.post('/ocr', upload.single('image'), async (req, res) => {
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
        { role: 'system', content: PROMPT_SISTEMA },
        { role: 'user', content: `Texto OCR:\n${extractedText}` },
      ],
      temperature: 0.1,
      reasoning_effort: 'low',
      response_format: { type: 'json_object' },
    });

    const rawContent = aiResponse.choices[0]?.message?.content || '';
    const cleanJson = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();

    res.json({
      success: true,
      text: extractedText,
      analisis: JSON.parse(cleanJson),
    });
  } catch (error) {
    console.error('Error procesando OCR/Groq:', error?.message || error);
    res.status(500).json({ success: false, error: 'Error procesando la boleta' });
  }
});

module.exports = router;
