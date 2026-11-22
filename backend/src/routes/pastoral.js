const { Router } = require('express');
const { enviarASheets, leerDeSheets } = require('../services/sheets');

const router = Router();

router.get('/pastoral', async (req, res) => {
  try {
    const { data } = await leerDeSheets('pastor');
    res.json({
      success: true,
      mensaje: data.data?.mensaje || '',
    });
  } catch (error) {
    console.error('Error leyendo mensaje pastoral:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/pastoral', async (req, res) => {
  try {
    const { mensaje } = req.body || {};
    await enviarASheets({ tipo: 'pastor', mensaje: mensaje || '' });
    res.json({ success: true });
  } catch (error) {
    console.error('Error guardando mensaje pastoral:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
