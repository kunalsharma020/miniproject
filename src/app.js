require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');

const cors = require('cors');

const { logger } = require('./utils/logger');
const { apiKeyAuth } = require('./middleware/apiKeyAuth');
const { notFound } = require('./middleware/notFound');
const { errorHandler } = require('./middleware/errorHandler');

const configRoutes = require('./routes/configRoutes');
const schemaRoutes = require('./routes/schemaRoutes');

const app = express();

app.disable('x-powered-by');
app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '1mb' }));

app.use(
  morgan('combined', {
    stream: {
      write: (msg) => logger.info({ http: msg.trim() }, 'http')
    }
  })
);

app.get('/health', (req, res) => res.json({ ok: true }));

app.use(apiKeyAuth);
app.use('/config', configRoutes);
app.use('/schema', schemaRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

