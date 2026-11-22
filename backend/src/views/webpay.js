/** Páginas HTML mínimas servidas por el backend para el flujo de donación con QR. */

/** Pantalla móvil para que el donante elija el monto tras escanear el QR. */
function paginaMontoQr(montoInicial) {
  return `<!DOCTYPE html>
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
</html>`;
}

/** Página intermedia que reenvía automáticamente al formulario de pago de Transbank. */
function paginaRedireccionWebpay(monto, url, token) {
  return `<!DOCTYPE html>
<html lang="es">
  <head><meta charset="UTF-8" /><title>Conectando con Webpay...</title></head>
  <body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
    <p>Conectando con Webpay Transbank ($${monto.toLocaleString('es-CL')})...</p>
    <form id="tbk-form" method="POST" action="${url}">
      <input type="hidden" name="token_ws" value="${token}" />
    </form>
    <script>document.getElementById('tbk-form').submit();</script>
  </body>
</html>`;
}

module.exports = { paginaMontoQr, paginaRedireccionWebpay };
