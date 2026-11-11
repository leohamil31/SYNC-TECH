import { motion } from 'framer-motion';
import GlassView from '../../design-system/GlassView';
import SyncTechLogo3D from '../../design-system/brand/SyncTechLogo3D';
import { rise, stagger } from '../../design-system/motion/variants';
import LanguageSwitch from '../../shell/LanguageSwitch';
import { useI18n } from '../../shared/i18n';
import './auth.css';

const TRACKS = ['Node.js', 'React', 'PostgreSQL', 'Docker', 'Git', 'GitHub', 'Express', 'SQL', 'APIs REST', 'JavaScript'];

/** Endless row of technology chips; the list is rendered twice so the loop has no seam. */
function Marquee({ items, reverse = false }) {
  return (
    <div className={`marquee${reverse ? ' marquee--reverse' : ''}`}>
      {[0, 1].map((copy) => (
        <ul key={copy} className="marquee-track" aria-hidden={copy === 1 || undefined}>
          {items.map((label) => (
            <li key={label} className="chip-tech">
              {label}
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}

/** Two-column sign-in canvas: the 3D wordmark over fluted glass on the left, the glass form on the right. */
export default function AuthLayout({ title, subtitle, children, footer }) {
  const { t } = useI18n();
  return (
    <div className="auth">
      <div className="auth-visual" aria-hidden="true">
        <span className="fluted" />
        <SyncTechLogo3D depth={14} />
        <p className="text-shine">{t('auth.pitch')}</p>
        <div className="auth-tracks">
          <Marquee items={TRACKS} />
          <Marquee items={[...TRACKS].reverse()} reverse />
        </div>
      </div>

      <motion.div className="auth-side" variants={stagger(0.06)} initial="initial" animate="animate">
        <div className="auth-lang">
          <LanguageSwitch />
        </div>
        <GlassView as={motion.main} className="auth-card beam-border" variants={rise}>
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
