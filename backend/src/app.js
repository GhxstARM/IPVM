const express = require('express');
const cors = require('cors');
// config/env carga el .env y debe requerirse antes que los módulos que leen process.env.
const { GROQ_MODEL, PORT, advertirConfiguracion } = require('./config/env');
const { usaPasswordPorDefecto } = require('./middleware/secretaria');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', require('./routes/secretaria'));
app.use('/api', require('./routes/finanzas'));
app.use('/api', require('./routes/ocr'));
app.use('/api', require('./routes/transparencia'));
app.use('/api', require('./routes/pastoral'));
app.use('/api', require('./routes/eventos'));
app.use('/api', require('./routes/webpay'));

if (require.main === module) {
  advertirConfiguracion({ usaPasswordPorDefecto: usaPasswordPorDefecto() });
  app.listen(PORT, () => {
    console.log(`Servidor en puerto ${PORT} (modelo: ${GROQ_MODEL})`);
  });
}

module.exports = app;
