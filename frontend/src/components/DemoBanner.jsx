import { motion } from 'framer-motion';
import { resetDemoData } from '../api/mock';
import { useI18n } from '../i18n';
import { ease } from './motion/variants';
import Icon from './Icon';

export default function DemoBanner() {
  const { t } = useI18n();
  const reset = () => {
    if (!window.confirm(t('messages.confirmReset'))) return;
    resetDemoData();
    window.location.reload();
  };

  return (
    <motion.div
      className="demo-banner"
      role="note"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease, delay: 0.2 }}
    >
      <span><strong>{t('demo.title')}</strong> {t('demo.text')}</span>
      <button type="button" className="btn btn-sm btn-ghost" onClick={reset}>
        <Icon name="refresh" size={14} className="spin-on-hover" /> {t('actions.reset')}
      </button>
    </motion.div>
  );
}
