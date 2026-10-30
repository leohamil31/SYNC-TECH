export default function Pagination({ meta, onChange }) {
  if (!meta || meta.total_pages <= 1) return meta ? <p className="muted small">{meta.total} record(s)</p> : null;
  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" className="btn" disabled={meta.page <= 1} onClick={() => onChange(meta.page - 1)}>Previous</button>
      <span className="muted small">Page {meta.page} of {meta.total_pages} · {meta.total} record(s)</span>
      <button type="button" className="btn" disabled={meta.page >= meta.total_pages} onClick={() => onChange(meta.page + 1)}>Next</button>
    </nav>
  );
}
