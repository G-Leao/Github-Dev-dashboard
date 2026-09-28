const ITEMS = [
  ["overview", "🏠", "Overview"],
  ["repos", "📦", "Repos"],
  ["analytics", "📊", "Analytics"],
  ["favorites", "⭐", "Favoritos"],
];

export default function Sidebar({ page, onChange }) {
  return (
    <nav className="sidebar glass" aria-label="Navegação principal">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">&lt;/&gt;</span>
        <span>Dev Dash<small>GITHUB INTELLIGENCE</small></span>
      </div>
      <div className="nav-list">
        <span className="nav-caption">Workspace</span>
        {ITEMS.map(([id, icon, label]) => (
          <button key={id} className={`nav-item ${page === id ? "active" : ""}`}
            aria-current={page === id ? "page" : undefined} onClick={() => onChange(id)}>
            <span className="nav-icon" aria-hidden="true">{icon}</span><span>{label}</span>
          </button>
        ))}
      </div>
      <div className="sidebar-footer"><span className="status-dot" /> API status: public</div>
    </nav>
  );
}
