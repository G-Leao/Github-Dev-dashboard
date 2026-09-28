export default function LoadingSkeleton() {
  return (
    <div className="skeleton-wrap" aria-busy="true" aria-label="Carregando">
      <div className="sk glass" style={{ height: 150 }} />
      <div className="grid-3">
        {[0, 1, 2].map((i) => <div key={i} className="sk glass" style={{ height: 100 }} />)}
      </div>
      <div className="grid-2">
        <div className="sk glass" style={{ height: 260 }} />
        <div className="sk glass" style={{ height: 260 }} />
      </div>
    </div>
  );
}
