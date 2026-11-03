const HttpError = require('../utils/http-error');

/**
 * Fixed-window, in-memory rate limiter keyed by client IP.
 * Enough for a single instance; behind several instances move the counters to Redis.
 *
 * @param {{ windowMs: number, max: number }} options
 */
const rateLimit = ({ windowMs, max }) => {
  const hits = new Map();

  // Drop expired windows so the map does not grow without bound.
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
  }, windowMs);
  sweep.unref();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip;
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;

    res.set('RateLimit-Limit', String(max));
    res.set('RateLimit-Remaining', String(Math.max(0, max - entry.count)));
    res.set('RateLimit-Reset', String(Math.ceil((entry.resetAt - now) / 1000)));

    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return next(HttpError.tooManyRequests());
    }
    return next();
  };
};

module.exports = rateLimit;
