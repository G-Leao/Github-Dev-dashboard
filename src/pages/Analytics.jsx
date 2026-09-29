import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import ActivityChart from "../components/ActivityChart";
import { topRepos } from "../utils/formatters";

export default function Analytics({ repos, events }) {
  // Conta os commits realizados em cada projeto
  const commitsByRepo = events
    .filter((event) => event.type === "PushEvent")
    .reduce((acc, event) => {
      const repoName = event.repo?.name;

      if (!repoName) return acc;

      const payload = event.payload || {};

      // A API pública de eventos nem sempre devolve a lista de commits do push.
      // Nesse caso usamos o total informado e, na ausência dele, cada push
      // passa a valer 1 (antes o gráfico ficava vazio em branco).
      const commits =
        payload.commits?.length ?? payload.distinct_size ?? payload.size ?? 1;

      acc[repoName] = (acc[repoName] || 0) + commits;

      return acc;
    }, {});

  // Junta os commits com os dados dos repositórios
  const topCommits = repos
    .map((repo) => ({
      name: repo.name,
      commits: commitsByRepo[repo.full_name] || 0,
    }))
    .filter((repo) => repo.commits > 0)
    .sort((a, b) => b.commits - a.commits)
    .slice(0, 8);

  return (
    <div className="stack">
      <section className="glass card">
        <h2>Commits por projeto</h2>

        {topCommits.length === 0 ? (
          <p className="chart-empty muted">
            Nenhum push registrado nos últimos 90 dias. Envie um push ou busque
            outro desenvolvedor.
          </p>
        ) : (
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topCommits}
                margin={{ top: 10, right: 14, bottom: 4, left: -8 }}
              >
                <defs>
                  <linearGradient id="commitBars" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#56d364" />
                    <stop offset="55%" stopColor="#2ea043" />
                    <stop offset="100%" stopColor="#196c2e" />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke="rgba(147,163,189,.12)"
                  vertical={false}
                />

                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(147,163,189,.16)" }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />

                <YAxis
                  allowDecimals={false}
                  stroke="#64748b"
                  tickLine={false}
                  axisLine={false}
                  width={38}
                />

                <Tooltip
                  cursor={{ fill: "rgba(63,185,80,.08)" }}
                  contentStyle={{
                    background: "rgba(10,16,28,.96)",
                    border: "1px solid rgba(63,185,80,.28)",
                    borderRadius: 12,
                    boxShadow: "0 18px 40px rgba(0,0,0,.5)",
                    fontSize: 12,
                  }}
                  labelStyle={{
                    color: "#94a3bd",
                    fontSize: 11,
                    fontFamily: "var(--mono)",
                  }}
                  formatter={(value) => [`${value} commits`, "Atividade"]}
                />

                <Bar
                  dataKey="commits"
                  fill="url(#commitBars)"
                  radius={[7, 7, 0, 0]}
                  maxBarSize={54}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <div className="grid-2">
        <section className="glass card">
          <h2>🔥 Mais populares</h2>

          <ol className="popular">
            {topRepos(repos).map((r) => (
              <li key={r.id}>
                <a href={r.html_url} target="_blank" rel="noreferrer">
                  {r.name}
                </a>

                <span className="muted">
                  ⭐ {r.stargazers_count} · 🍴 {r.forks_count}
                </span>
              </li>
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
