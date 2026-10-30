const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const YAML = require('yaml');
const swaggerUi = require('swagger-ui-express');
const { env, corsOrigin } = require('./config/env');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middlewares/error-handler');

const openapi = YAML.parse(fs.readFileSync(path.join(__dirname, 'docs/openapi.yaml'), 'utf8'));
// Built React app, copied next to the API in the Docker image.
const frontendDist = process.env.FRONTEND_DIST || path.join(__dirname, '../../frontend/dist');

const app = express();

// Swagger UI and the SPA use inline scripts/styles, so CSP is relaxed for them.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '1mb' }));
if (env !== 'test') app.use(morgan(env === 'production' ? 'combined' : 'dev'));

app.get('/api/docs.json', (req, res) => res.json(openapi));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi, { customSiteTitle: 'Course Manager API' }));
app.use('/api', routes);
app.use('/api', notFoundHandler);

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // Client-side routing: any non-API GET falls back to index.html.
  app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(frontendDist, 'index.html')));
}

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
