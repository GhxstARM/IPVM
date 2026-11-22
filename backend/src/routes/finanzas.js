const { Router } = require('express');
const { requiereSecretaria } = require('../middleware/secretaria');
const { enviarASheets, gestionarFinanzas, leerDeSheets } = require('../services/sheets');
const cacheTransparencia = require('../services/cacheTransparencia');

const router = Router();

const TIPOS_FINANZAS = ['gastos', 'ingresos'];

/** Middleware: valida el parámetro `:tipo` de las rutas de finanzas. */
function validarTipo(req, res, next) {
  if (!TIPOS_FINANZAS.includes(req.params.tipo)) {
    return res.status(400).json({ success: false, error: 'Tipo de registro inválido.' });
  }
  next();
}

/** Ejecuta una operación de finanzas, invalida la caché pública y responde. */
async function ejecutarOperacion(res, operacion) {
  try {
    const data = await operacion();
    cacheTransparencia.invalidar();
    res.json(data);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
}

router.get('/finanzas', requiereSecretaria, async (req, res) => {
  try {
    const { response, data } = await leerDeSheets('gestion');
    if (!response.ok || !data.success) throw new Error(data.error || 'No se pudieron leer las hojas.');
    res.json({ gastos: data.gastos || [], ingresos: data.ingresos || [] });
  } catch (error) {
    res.status(502).json({ success: false, error: error.message });
  }
});

router.post('/finanzas/:tipo', requiereSecretaria, validarTipo, (req, res) =>
  ejecutarOperacion(res, () =>
    gestionarFinanzas({ type: req.params.tipo, operation: 'create', record: req.body })
  )
);

router.put('/finanzas/:tipo/:id', requiereSecretaria, validarTipo, (req, res) =>
  ejecutarOperacion(res, () =>
    gestionarFinanzas({ type: req.params.tipo, operation: 'update', id: req.params.id, record: req.body })
  )
);

router.delete('/finanzas/:tipo/:id', requiereSecretaria, validarTipo, (req, res) =>
  ejecutarOperacion(res, () =>
    gestionarFinanzas({ type: req.params.tipo, operation: 'delete', id: req.params.id })
  )
);

// Guardado de un gasto (el frontend puede corregir los datos del OCR antes de confirmar)
// Body esperado: { gasto, fecha, razon, monto }
router.post('/gastos', requiereSecretaria, async (req, res) => {
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

    cacheTransparencia.invalidar();
    res.json({ success: true });
  } catch (error) {
    console.error('Error guardando gasto:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
