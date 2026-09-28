import { activityGrid } from "../utils/formatters";

const level = (n) => (n === 0 ? 0 : n < 3 ? 1 : n < 6 ? 2 : n < 10 ? 3 : 4);

export default function ActivityChart({ events }) {
  const grid = activityGrid(events);
  return (
    <div>
      <div className="heat" role="img" aria-label="Atividade pública das últimas 8 semanas">
        {grid.map((week, i) => (
          <div key={i} className="heat-col">
            {week.map((d) => (
              <span key={d.date} className={`cell l${level(d.count)} ${d.future ? "future" : ""}`}
                title={`${d.date}: ${d.count} eventos`} />
            ))}
          </div>
        ))}
      </div>
      <p className="muted small">Eventos públicos recentes (a API do GitHub retorna só os últimos 90 dias).</p>
    </div>
  );
}
