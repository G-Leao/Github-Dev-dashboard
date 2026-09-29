import { useState } from "react";
import { activityGrid } from "../utils/formatters";

const level = (n) => (n === 0 ? 0 : n < 3 ? 1 : n < 6 ? 2 : n < 10 ? 3 : 4);

export default function ActivityChart({ events }) {
  const grid = activityGrid(events);
  const [tooltip, setTooltip] = useState(null);

  return (
    <div className="activity-wrapper">
      <div
        className="heat"
        role="img"
        aria-label="Atividade pública dos últimos 90 dias"
      >
        {grid.map((week, i) => (
          <div key={i} className="heat-col">
            {week.map((d) => (
              <span
                key={d.date}
                className={`cell l${level(d.count)} ${
                  d.future ? "future" : ""
                }`}
                onMouseEnter={() => {
                  setTooltip({
                    date: d.date,
                    count: d.count,
                  });
                }}
                onMouseMove={(e) => {
                  setTooltip((prev) => ({
                    ...prev,
                    x: e.clientX + 12,
                    y: e.clientY + 12,
                  }));
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            ))}
          </div>
        ))}
      </div>

      <p className="muted small">Últimos 90 dias.</p>

      {tooltip && (
        <div
          className="activity-tooltip"
          style={{
            left: tooltip.x,
            top: tooltip.y,
          }}
        >
          <strong>
            {tooltip.count} {tooltip.count === 1 ? "commit" : "commits"}
          </strong>

          <span>{tooltip.date}</span>
        </div>
      )}
    </div>
  );
}
