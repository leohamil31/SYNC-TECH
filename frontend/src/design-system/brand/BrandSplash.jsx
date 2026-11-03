import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import SyncTechLogo3D from './SyncTechLogo3D';
import { useI18n } from '../../shared/i18n';

const KEY = 'synctech-splash-seen';
const DURATION = 3400;

const shouldShow = () => {
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    return !sessionStorage.getItem(KEY);
  } catch {
    return false;
  }
};

/** Brand intro shown once per browser session, then fades into the app. */
export default function BrandSplash() {
  const { t } = useI18n();
  const [open, setOpen] = useState(shouldShow);

  useEffect(() => {
    if (!open) return undefined;
    try { sessionStorage.setItem(KEY, '1'); } catch { /* ignore */ }
    const timer = setTimeout(() => setOpen(false), DURATION);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => { clearTimeout(timer); window.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: 'blur(8px)', transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }}
        >
          <SyncTechLogo3D sway={false} />
          <button type="button" className="splash-skip" onClick={() => setOpen(false)}>{t('actions.skip')}</button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
