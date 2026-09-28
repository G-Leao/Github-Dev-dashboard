export default function StatCard({ icon, value, label }) {
  return (
    <div className="stat glass">
      <div className="stat-heading">
        <span className="muted">{label}</span>
        <span className="stat-icon" aria-hidden="true">{icon}</span>
      </div>
      <strong>{value}</strong>
      <span className="stat-detail">dados do perfil</span>
    </div>
  );
}
