import { motion } from 'framer-motion';
import { rise } from './motion/variants';

// Children inherit the page's stagger (PageTransition) — no props changed.
export default function PageHeader({ title, subtitle, eyebrow, actions }) {
  return (
    <motion.header className="page-header" variants={rise}>
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </motion.header>
  );
}
