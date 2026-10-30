const app = require('./app');
const db = require('./db/connection');
const { port, env } = require('./config/env');

const server = app.listen(port, () => {
  console.log(`API running on http://localhost:${port} (${env}) - docs at /api/docs`);
});

const shutdown = (signal) => {
  console.log(`${signal} received, shutting down`);
  server.close(() => db.destroy().then(() => process.exit(0)));
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
