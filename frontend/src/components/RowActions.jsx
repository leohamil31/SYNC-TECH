export default function RowActions({ onEdit, onDelete, children }) {
  return (
    <div className="row-actions">
      {children}
      <button type="button" className="btn btn-sm" onClick={onEdit}>Edit</button>
      <button type="button" className="btn btn-sm btn-danger" onClick={onDelete}>Delete</button>
    </div>
  );
}
