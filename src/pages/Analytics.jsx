import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import ActivityChart from "../components/ActivityChart";
import { topRepos } from "../utils/formatters";

export default function Analytics({ repos, events }) {
  const top = topRepos(repos, 8).map((r) => ({ name: r.name, stars: r.stargazers_count }));
  return (
    <div className="stack">
      <section className="glass card">
        <h2>Stars por projeto</h2>
        <div className="chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={top}>
              <CartesianGrid stroke="rgba(255,255,255,.08)" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: "#0b1733", border: "1px solid #1e3a8a", borderRadius: 8 }} />
              <Bar dataKey="stars" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <div className="grid-2">
        <section className="glass card">
          <h2>🔥 Mais populares</h2>
          <ol className="popular">
            {topRepos(repos).map((r) => (
              <li key={r.id}><a href={r.html_url} target="_blank" rel="noreferrer">{r.name}</a>
                <span className="muted">⭐ {r.stargazers_count} · 🍴 {r.forks_count}</span></li>
            ))}
          </ol>
        </section>
        <section className="glass card">
          <h2>Atividade</h2>
          <ActivityChart events={events} />
        </section>
      </div>
    </div>
  );
}
