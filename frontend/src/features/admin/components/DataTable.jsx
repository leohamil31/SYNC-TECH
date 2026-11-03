import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useI18n } from '../../../shared/i18n';
import { row as rowVariants } from '../../../design-system/motion/variants';
import Icon from '../../../design-system/Icon';

/**
 * Table with staggered rows, slide-out on delete and a brief highlight on created/updated rows.
 * On phones rows stack as label/value pairs (data-label + .table-stack).
 */
export default function DataTable({ columns, rows, actions, empty, loading }) {
  const { t } = useI18n();
  const colSpan = columns.length + (actions ? 1 : 0);

  // Track row signatures so changed rows can flash once.
  const seen = useRef(null);
  const sig = (r) => JSON.stringify(r);
  const isFresh = (r) => seen.current && seen.current.get(r.id) !== sig(r);
  useEffect(() => {
    if (rows.length) seen.current = new Map(rows.map((r) => [r.id, sig(r)]));
  }, [rows]);

  return (
    <div className="table-wrap">
      <table className="table-stack">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.numeric ? 'num' : undefined} scope="col">
                {c.label}
              </th>
            ))}
            {actions && (
              <th className="actions-col" scope="col">
                <span className="sr-only">{t('common.actions')}</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {loading &&
            rows.length === 0 &&
            Array.from({ length: 4 }, (_, i) => (
              <tr key={`skeleton-${i}`}>
                {Array.from({ length: colSpan }, (__, j) => (
                  <td key={j}>
                    <span className="skeleton" />
                  </td>
                ))}
              </tr>
            ))}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={colSpan} className="empty">
                <Icon name="inbox" size={26} />
                <div>{empty || t('common.noRecords')}</div>
              </td>
            </tr>
          )}
          <AnimatePresence initial mode="popLayout">
            {rows.map((r, i) => (
              <motion.tr
                key={r.id}
                layout="position"
                custom={i}
                variants={rowVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className={isFresh(r) ? 'is-flash' : undefined}
              >
                {columns.map((c) => (
                  <td key={c.key} className={c.numeric ? 'num' : undefined} data-label={c.label}>
                    {c.render ? c.render(r) : r[c.key]}
                  </td>
                ))}
                {actions && <td className="actions-col">{actions(r)}</td>}
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}
