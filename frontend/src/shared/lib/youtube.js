// Mirrors backend/src/utils/youtube.js (the API stores canonical watch URLs).
const ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export function videoIdFrom(url) {
  if (!url) return null;
  if (ID_PATTERN.test(url)) return url;
  try {
    const parsed = new URL(url);
    const id =
      parsed.hostname === 'youtu.be'
        ? parsed.pathname.slice(1)
        : parsed.searchParams.get('v') || parsed.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/)?.[1];
    return id && ID_PATTERN.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** hqdefault exists for every public video (maxres does not). */
export const thumbnailUrl = (url) => {
  const id = videoIdFrom(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
};

let apiPromise;

/** Loads the YouTube IFrame Player API once and resolves with `window.YT`. */
export function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  apiPromise ??= new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT);
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => {
      apiPromise = undefined;
      reject(new Error('YouTube player failed to load'));
    };
    document.head.appendChild(script);
  });
  return apiPromise;
}
