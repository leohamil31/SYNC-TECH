import { motion } from 'framer-motion';
import { LANGUAGES, useI18n } from '../shared/i18n';
import { spring } from '../design-system/motion/variants';

export default function LanguageSwitch({ layoutId = 'lang-thumb' }) {
  const { t, language, setLanguage } = useI18n();
  return (
    <div className="segmented" role="group" aria-label={t('settings.language')}>
      {LANGUAGES.map((l) => (
        <button key={l.code} type="button" aria-pressed={language === l.code} title={l.label} onClick={() => setLanguage(l.code)}>
          {language === l.code && <motion.span layoutId={layoutId} className="segmented-thumb" transition={spring} />}
          {l.short}
        </button>
      ))}
    </div>
  );
}
