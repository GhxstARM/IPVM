const { Router } = require('express');
const { leerDeSheets } = require('../services/sheets');
const cacheTransparencia = require('../services/cacheTransparencia');

const router = Router();

router.get('/transparencia', async (req, res) => {
  try {
    const vigente = cacheTransparencia.obtenerVigente();
    if (vigente) return res.json(vigente);

    const { data } = await leerDeSheets('transparencia');
    if (!data.success) throw new Error(data.error || 'Error al obtener transparencia');

    const payload = {
      success: true,
      gastos: data.gastos || [],
      ingresos: data.ingresos || [],
    };
    cacheTransparencia.guardar(payload);
    res.json(payload);
  } catch (error) {
    console.error('Error leyendo transparencia:', error.message);
    // Si Sheets falla, se sirve el último dato conocido.
    const ultimo = cacheTransparencia.obtenerUltimo();
    if (ultimo) return res.json(ultimo);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
