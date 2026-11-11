import { Fragment } from 'react';
import { motion } from 'framer-motion';
import { ease } from './variants';

const container = (delay, step) => ({
  initial: {},
  animate: { transition: { delayChildren: delay, staggerChildren: step } },
});

const word = {
  initial: { opacity: 0, y: '0.55em', rotateX: -70, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease } },
};

/**
 * Headline that assembles word by word. The full text stays in an sr-only span
 * so screen readers read one sentence instead of separate words.
 * Words wrapped in *asterisks* get the italic serif accent.
 */
export default function TextReveal({ as = 'h1', text, delay = 0, step = 0.07, className }) {
  const Component = motion[as];
  return (
    <Component className={`text-reveal ${className || ''}`} variants={container(delay, step)} initial="initial" animate="animate">
      <span className="sr-only">{text.replace(/\*/g, '')}</span>
      <span aria-hidden="true">
        {text.split(' ').map((w, i) => (
          <Fragment key={`${w}-${i}`}>
            <span className="text-reveal-word">
              <motion.span variants={word} className={w.includes('*') ? 'accent' : undefined}>
                {w.replace(/\*/g, '')}
              </motion.span>
            </span>{' '}
          </Fragment>
        ))}
      </span>
    </Component>
  );
}
