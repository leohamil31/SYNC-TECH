import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { loadYouTubeApi, videoIdFrom } from '../../../shared/lib/youtube';
import { useI18n } from '../../../shared/i18n';
import Icon from '../../../design-system/Icon';
import VideoThumb from './VideoThumb';

const TICK_MS = 5000;

/**
 * YouTube IFrame Player wrapper that reports playback for progress tracking.
 *   onProgress(seconds, duration) — every 5 s while playing, on pause and on unmount
 *   onEnded()                     — when the video finishes
 * Callbacks are read through refs, so passing new functions never recreates the player.
 * If the Player API cannot load (blocked script, offline), a plain embed is shown instead.
 */
export default function YouTubePlayer({ videoUrl, startAt = 0, title, onProgress, onEnded }) {
  const { t } = useI18n();
  const containerRef = useRef(null);
  const callbacks = useRef({ onProgress, onEnded });
  callbacks.current = { onProgress, onEnded };
  const startRef = useRef(startAt);
  const [state, setState] = useState('loading'); // loading | ready | fallback
  const videoId = videoIdFrom(videoUrl);

  useEffect(() => {
    if (!videoId) return undefined;
    let player;
    let timer;
    let cancelled = false;
    setState('loading');

    const report = () => {
      if (!player?.getCurrentTime) return;
      const seconds = player.getCurrentTime();
      const total = player.getDuration?.() || 0;
      if (Number.isFinite(seconds)) callbacks.current.onProgress?.(seconds, total);
    };

    // The player replaces its host node, so it gets a node React does not own.
    const host = document.createElement('div');
    containerRef.current.appendChild(host);

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        player = new YT.Player(host, {
          host: 'https://www.youtube-nocookie.com',
          videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            start: Math.floor(startRef.current || 0),
            rel: 0,
            playsinline: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: () => !cancelled && setState('ready'),
            onError: () => !cancelled && setState('fallback'),
            onStateChange: ({ data }) => {
              clearInterval(timer);
              if (data === YT.PlayerState.PLAYING) timer = setInterval(report, TICK_MS);
              if (data === YT.PlayerState.PAUSED) report();
              if (data === YT.PlayerState.ENDED) {
                report();
                callbacks.current.onEnded?.();
              }
            },
          },
        });
      })
      .catch(() => !cancelled && setState('fallback'));

    return () => {
      cancelled = true;
      clearInterval(timer);
      report();
      try {
        player?.destroy();
      } catch {
        // Player already gone.
      }
      host.remove();
    };
  }, [videoId]);

  if (!videoId) {
    return (
      <div className="player player-empty">
        <Icon name="video" size={32} />
        <span>{t('lesson.noVideo')}</span>
      </div>
    );
  }

  return (
    <div className="player">
      <div ref={containerRef} className="player-frame" hidden={state === 'fallback'} />
      {state === 'fallback' && (
        <iframe
          className="player-frame"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?start=${Math.floor(startAt)}&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}
      <AnimatePresence>
        {state === 'loading' && (
          <motion.div className="player-poster" exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.35 }}>
            <VideoThumb videoUrl={videoUrl} />
            <span className="player-spinner" aria-label={t('common.loading')} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
