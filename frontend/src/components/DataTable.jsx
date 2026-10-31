import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useI18n } from '../i18n';
import { row as rowVariants } from './motion/variants';
import Icon from './Icon';

/**
 * Rows stagger in on load, slide out on delete, and newly-appearing/updated rows
 * get a brief highlight (`is-flash`). API is unchanged from the original.
 */
export default function DataTable({ columns, rows, actions, empty, loading }) {
  const { t } = useI18n();
  const colSpan = columns.length + (actions ? 1 : 0);

  // Track row signatures so created/updated rows can flash once.
  const seen = useRef(null);
  const sig = (r) => JSON.stringify(r);
  const isFresh = (r) => seen.current && seen.current.get(r.id) !== sig(r);
  useEffect(() => {
    if (rows.length) seen.current = new Map(rows.map((r) => [r.id, sig(r)]));
  }, [rows]);

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((c) => <th key={c.key} className={c.numeric ? 'num' : undefined}>{c.label}</th>)}
            {actions && <th className="actions-col"><span className="sr-only">Actions</span></th>}
          </tr>
        </thead>
        <tbody>
          {loading && rows.length === 0 &&
            Array.from({ length: 4 }, (_, i) => (
              <tr key={`skeleton-${i}`} className="skeleton-row">
                {Array.from({ length: colSpan }, (__, j) => <td key={j}><span className="skeleton" /></td>)}
              </tr>
            ))}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={colSpan} className="empty">
                <Icon name="inbox" size={28} />
                <span>{empty || t('common.noRecords')}</span>
              </td>
            </tr>
          )}
          <AnimatePresence initial={true} mode="popLayout">
            {rows.map((row, i) => (
              <motion.tr
                key={row.id}
                layout="position"
                custom={i}
                variants={rowVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className={isFresh(row) ? 'is-flash' : undefined}
              >
                {columns.map((c) => (
                  <td key={c.key} className={c.numeric ? 'num' : undefined}>
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
                {actions && <td className="actions-col">{actions(row)}</td>}
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}
