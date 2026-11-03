const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const YAML = require('yaml');
const swaggerUi = require('swagger-ui-express');
const { env, isProduction, corsOrigin, trustProxy } = require('./config/env');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middlewares/error-handler');

const openapi = YAML.parse(fs.readFileSync(path.join(__dirname, 'docs/openapi.yaml'), 'utf8'));
// Built React app, copied next to the API in the Docker image.
const frontendDist = process.env.FRONTEND_DIST || path.join(__dirname, '../../frontend/dist');

/**
 * CSP for the web app. Lessons are YouTube embeds (IFrame Player API), so the
 * player script, its frame and thumbnails are the only third-party origins allowed.
 */
const spaContentSecurityPolicy = helmet.contentSecurityPolicy({
  useDefaults: true,
  directives: {
    'script-src': ["'self'", 'https://www.youtube.com', 'https://s.ytimg.com'],
    'frame-src': ['https://www.youtube-nocookie.com', 'https://www.youtube.com'],
    'img-src': ["'self'", 'data:', 'https://i.ytimg.com'],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'connect-src': ["'self'"],
    // Only upgrade to HTTPS where HTTPS exists; on plain http://localhost it would break asset loading.
    'upgrade-insecure-requests': isProduction ? [] : null,
  },
});

const app = express();
app.set('trust proxy', trustProxy);

// Swagger UI ships inline scripts, so the strict CSP is only applied to the SPA below.
app.use(helmet({ contentSecurityPolicy: false }));
// Same-origin in production (Express serves the SPA); CORS only matters for external API clients.
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '1mb' }));
if (env !== 'test') app.use(morgan(env === 'production' ? 'combined' : 'dev'));

app.get('/api/docs.json', (req, res) => res.json(openapi));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi, {
  customSiteTitle: 'SyncTech API',
  swaggerOptions: { persistAuthorization: true },
}));
app.use('/api', routes);
app.use('/api', notFoundHandler);

if (fs.existsSync(frontendDist)) {
  app.use(spaContentSecurityPolicy);
  // Hashed assets are immutable; index.html must always be revalidated.
  app.use(express.static(frontendDist, {
    setHeaders: (res, file) => {
      if (file.includes(`${path.sep}assets${path.sep}`)) res.set('Cache-Control', 'public, max-age=31536000, immutable');
    },
  }));
  // Client-side routing: any non-API GET falls back to index.html.
  app.get(/^(?!\/api).*/, (req, res) => {
    res.set('Cache-Control', 'no-cache');
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
