import { motion } from 'framer-motion';
import SyncTechLogo3D from '../brand/SyncTechLogo3D';
import { rise, stagger } from './variants';

/** Dashboard hero: title and subtitle next to the animated 3D SyncTech logo (CSS only, no WebGL). */
export default function Hero({ title, subtitle, eyebrow, children }) {
  return (
    <motion.div className="hero" variants={stagger(0.06)} initial="initial" animate="animate">
      <div className="hero-copy">
        {eyebrow && <motion.span variants={rise} className="tag">{eyebrow}</motion.span>}
        <motion.h1 variants={rise}>{title}</motion.h1>
        {subtitle && <motion.p variants={rise} className="page-subtitle">{subtitle}</motion.p>}
        {children && <motion.div variants={rise}>{children}</motion.div>}
      </div>
      <div className="hero-visual">
        <SyncTechLogo3D depth={12} className="on-surface" />
      </div>
    </motion.div>
  );
}
