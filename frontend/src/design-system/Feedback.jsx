import { motion } from 'framer-motion';
import { rise } from './motion/variants';
import Icon from './Icon';

export function PageHeader({ title, subtitle, actions, children }) {
  return (
    <motion.header className="page-header" variants={rise}>
      <div>
        {children}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </motion.header>
  );
}

export function EmptyState({ icon = 'inbox', title, children, action }) {
  return (
    <div className="empty-state">
      <Icon name={icon} size={30} />
      {title && <h3>{title}</h3>}
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function ErrorAlert({ children, onRetry, retryLabel }) {
  return (
    <div className="alert" role="alert">
      <Icon name="alert" size={18} />
      <span className="grow">{children}</span>
      {onRetry && (
        <button type="button" className="btn btn-sm" onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </div>
  );
}

export function Skeleton({ width = '100%', height = 12, style }) {
  return <span className="skeleton" style={{ width, height, ...style }} aria-hidden="true" />;
}
