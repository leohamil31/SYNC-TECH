/*
 * YouTube helpers shared by validation and seeds.
 * Accepted inputs: watch URLs, youtu.be short links, /embed/ and /shorts/ URLs, or a bare 11-char id.
 */

const ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtube-nocookie.com']);

const extractVideoId = (input) => {
  if (typeof input !== 'string') return null;
  const value = input.trim();
  if (ID_PATTERN.test(value)) return value;

  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (!HOSTS.has(url.hostname)) return null;

  const candidate =
    url.hostname === 'youtu.be'
      ? url.pathname.slice(1)
      : url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/)?.[1];

  return candidate && ID_PATTERN.test(candidate) ? candidate : null;
};

const watchUrl = (id) => `https://www.youtube.com/watch?v=${id}`;

module.exports = { extractVideoId, watchUrl };
