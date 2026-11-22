const { Router } = require('express');
const {
  requiereSecretaria,
  extraerToken,
  passwordValida,
  abrirSesion,
  cerrarSesion,
} = require('../middleware/secretaria');

const router = Router();

router.post('/secretaria/login', (req, res) => {
  if (!passwordValida(req.body?.password)) {
    return res.status(401).json({ success: false, error: 'Contraseña incorrecta.' });
  }
  res.json({ success: true, token: abrirSesion() });
});

router.post('/secretaria/logout', requiereSecretaria, (req, res) => {
  cerrarSesion(extraerToken(req));
  res.json({ success: true });
});

module.exports = router;
