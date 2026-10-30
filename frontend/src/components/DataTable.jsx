export default function DataTable({ columns, rows, actions, empty = 'No records found.' }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((c) => <th key={c.key} className={c.numeric ? 'num' : undefined}>{c.label}</th>)}
            {actions && <th className="actions-col">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={columns.length + (actions ? 1 : 0)} className="empty">{empty}</td></tr>
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
