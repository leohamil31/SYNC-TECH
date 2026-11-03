import { motion } from 'framer-motion';
import GlassView from '../../design-system/GlassView';
import SyncTechLogo3D from '../../design-system/brand/SyncTechLogo3D';
import { rise, stagger } from '../../design-system/motion/variants';
import LanguageSwitch from '../../shell/LanguageSwitch';
import { useI18n } from '../../shared/i18n';
import './auth.css';

/** Two-column sign-in canvas: the 3D wordmark on the left, the glass form on the right. */
export default function AuthLayout({ title, subtitle, children, footer }) {
  const { t } = useI18n();
  return (
    <div className="auth">
      <div className="auth-visual" aria-hidden="true">
        <SyncTechLogo3D depth={14} />
        <p>{t('auth.pitch')}</p>
      </div>

      <motion.div className="auth-side" variants={stagger(0.06)} initial="initial" animate="animate">
        <div className="auth-lang">
          <LanguageSwitch />
        </div>
        <GlassView as={motion.main} className="auth-card" variants={rise}>
          <h1>{title}</h1>
          {subtitle && <p className="muted">{subtitle}</p>}
          {children}
        </GlassView>
        {footer && (
          <motion.p className="auth-footer" variants={rise}>
            {footer}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
