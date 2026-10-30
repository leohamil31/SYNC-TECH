import { resetDemoData } from '../api/mock';

export default function DemoBanner() {
  const reset = () => {
    if (!window.confirm('Restore the original seed data?')) return;
    resetDemoData();
    window.location.reload();
  };

  return (
    <div className="demo-banner" role="note">
      <span>
        <strong>Static demo (GitHub Pages).</strong> The API runs inside your browser with the same seed
        data and rules; changes are saved in this browser only. The full stack (Node.js + PostgreSQL) runs with Docker.
      </span>
      <button type="button" className="btn btn-sm" onClick={reset}>Reset data</button>
    </div>
  );
}
