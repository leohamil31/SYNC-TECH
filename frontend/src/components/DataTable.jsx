import { useI18n } from '../i18n';
import Icon from './Icon';

export default function DataTable({ columns, rows, actions, empty, loading }) {
  const { t } = useI18n();
  const colSpan = columns.length + (actions ? 1 : 0);

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
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((c) => (
                <td key={c.key} className={c.numeric ? 'num' : undefined}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
              {actions && <td className="actions-col">{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
