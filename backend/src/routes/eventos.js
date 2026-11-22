const { Router } = require('express');
const { enviarASheets, leerDeSheets } = require('../services/sheets');

const router = Router();

const dosDigitos = (n) => String(n).padStart(2, '0');

/** Normaliza una fecha de la hoja a "YYYY-MM-DD". */
function formatearFecha(val) {
  if (!val) return '';
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const d = new Date(val);
  if (isNaN(d.getTime())) return str;
  return `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}`;
}

/** Normaliza una hora de la hoja a "HH:mm". */
function formatearHora(val) {
  if (!val) return '';
  const str = String(val).trim();
  if (/^\d{1,2}:\d{2}$/.test(str)) return str;
  const d = new Date(val);
  if (isNaN(d.getTime())) return str;
  return `${dosDigitos(d.getHours())}:${dosDigitos(d.getMinutes())}`;
}

router.get('/eventos', async (req, res) => {
  try {
    const { data } = await leerDeSheets('eventos');
    const eventos = (data.eventos || []).map((ev) => ({
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

router.post('/eventos', async (req, res) => {
  try {
    const { titulo, fecha, hora, descripcion } = req.body || {};
    const result = await enviarASheets({ tipo: 'evento', titulo, fecha, hora, descripcion });
    res.json({ success: true, id: result.id, titulo, fecha, hora, descripcion });
  } catch (error) {
    console.error('Error guardando evento:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/eventos/:id', async (req, res) => {
  try {
    await enviarASheets({ tipo: 'eliminar_evento', id: req.params.id });
    res.json({ success: true });
  } catch (error) {
    console.error('Error eliminando evento:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
