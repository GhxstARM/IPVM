const crypto = require('crypto');
const { Router } = require('express');
const {
  WebpayPlus,
  Options,
  IntegrationApiKeys,
  IntegrationCommerceCodes,
  Environment,
} = require('transbank-sdk');
const { gestionarFinanzas } = require('../services/sheets');
const cacheTransparencia = require('../services/cacheTransparencia');
const { paginaMontoQr, paginaRedireccionWebpay } = require('../views/webpay');

const router = Router();

const MONTO_MINIMO = 500;
const ERROR_MONTO_MINIMO = `El monto mínimo de donación es $${MONTO_MINIMO}.`;

const txWebpay = new WebpayPlus.Transaction(
  new Options(
    IntegrationCommerceCodes.WEBPAY_PLUS, // Código de comercio de prueba: 597055555532
    IntegrationApiKeys.WEBPAY, // API Key pública de integración
    Environment.Integration // Apunta a webpay3gint.transbank.cl
  )
);

function obtenerUrlsBase(req) {
  const backend = (process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  const frontend = (process.env.FRONTEND_URL || `${req.protocol}://${req.hostname}:5173`).replace(/\/$/, '');
  return { backend, frontend };
}

/** Monto entero válido (>= mínimo) del valor recibido, o `null` si no lo es. */
function montoValido(valor) {
  const monto = Math.round(Number(valor));
  return monto && monto >= MONTO_MINIMO ? monto : null;
}

/** Crea la transacción en Transbank; devuelve `{ url, token }` del formulario de pago. */
function crearTransaccion(req, monto) {
  const { backend } = obtenerUrlsBase(req);
  const buyOrder = `DON-${Date.now()}`;
  const sessionId = `SES-${crypto.randomBytes(8).toString('hex')}`;
  return txWebpay.create(buyOrder, sessionId, monto, `${backend}/api/webpay/retorno`);
}

/** Registra la donación aprobada como ingreso; un fallo aquí no debe afectar al donante. */
async function registrarIngreso(resultado) {
  try {
    await gestionarFinanzas({
      type: 'ingresos',
      operation: 'create',
      record: {
        fecha: new Date().toISOString().split('T')[0],
        concepto: `Donación Webpay (${resultado.buy_order})`,
        monto: resultado.amount,
      },
    });
    cacheTransparencia.invalidar();
  } catch (sheetErr) {
    console.error('Donación aprobada, pero falló el registro en Sheets:', sheetErr.message);
  }
}

// 1A-1. Pantalla móvil al escanear el QR para que el donante elija el monto
router.get('/webpay/qr', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(paginaMontoQr(montoValido(req.query?.monto) ?? ''));
});

// 1A-2. Procesa el monto elegido y redirige a Transbank
router.post('/webpay/qr', async (req, res) => {
  try {
    const monto = montoValido(req.body?.monto);
    if (!monto) return res.status(400).send(ERROR_MONTO_MINIMO);

    const response = await crearTransaccion(req, monto);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(paginaRedireccionWebpay(monto, response.url, response.token));
  } catch (error) {
    console.error('Error iniciando QR Webpay:', error);
    res.status(500).send('No se pudo conectar con Webpay Transbank.');
  }
});

// 1B. Acceso desde el botón del formulario en la web
router.post('/webpay/crear', async (req, res) => {
  try {
    const monto = montoValido(req.body?.monto);
    if (!monto) return res.status(400).json({ success: false, error: ERROR_MONTO_MINIMO });

    const response = await crearTransaccion(req, monto);
    res.json({ success: true, url: response.url, token: response.token });
  } catch (error) {
    console.error('Error creando transacción Webpay:', error);
    res.status(500).json({ success: false, error: 'No se pudo iniciar el pago con Webpay.' });
  }
});

// 2. Transbank redirige el navegador del donante aquí al finalizar o anular el pago
router.all('/webpay/retorno', async (req, res) => {
  const { frontend } = obtenerUrlsBase(req);

  try {
    const tokenWs = req.body?.token_ws || req.query?.token_ws;
    const tbkToken = req.body?.TBK_TOKEN || req.query?.TBK_TOKEN;

    if (!tokenWs && tbkToken) return res.redirect(`${frontend}/?estado=anulada`);
    if (!tokenWs) return res.redirect(`${frontend}/?estado=error`);

    const resultado = await txWebpay.commit(tokenWs);

    if (resultado.status === 'AUTHORIZED' && resultado.response_code === 0) {
      await registrarIngreso(resultado);
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

module.exports = router;
