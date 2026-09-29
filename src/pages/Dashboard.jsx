import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import ProfileCard from "../components/ProfileCard";
import StatCard from "../components/StatCard";
import LanguageChart from "../components/LanguageChart";
import {
  formatNumber,
  totalStars,
  languageStats,
  reposByYear,
} from "../utils/formatters";

export default function Dashboard({ user, repos }) {
  const years = reposByYear(repos);
  return (
    <div className="stack">
      <ProfileCard user={user} />
      <div className="grid-3">
        <StatCard
          icon="📦"
          value={formatNumber(user.public_repos)}
          label="Repositórios"
        />
        <StatCard
          icon="👥"
          value={formatNumber(user.followers)}
          label="Seguidores"
        />
        <StatCard
          icon="⭐"
          value={formatNumber(totalStars(repos))}
          label="Stars recebidas"
        />
      </div>
      <div className="grid-2">
        <section className="glass card">
          <h2>Repositórios ao longo do tempo</h2>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={years}
                margin={{ top: 10, right: 14, bottom: 4, left: -8 }}
              >
                <defs>
                  <linearGradient id="reposLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#2f7dff" />
                    <stop offset="100%" stopColor="#4de4ef" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="rgba(147,163,189,.12)"
                  vertical={false}
                />
                <XAxis
                  dataKey="year"
                  stroke="#64748b"
                  tickLine={false}
                  axisLine={{ stroke: "rgba(147,163,189,.16)" }}
                />
                <YAxis
                  allowDecimals={false}
                  stroke="#64748b"
                  tickLine={false}
                  axisLine={false}
                  width={38}
                />
                <Tooltip
                  cursor={{
                    stroke: "rgba(96,178,255,.35)",
                    strokeDasharray: "4 4",
                  }}
                  contentStyle={{
                    background: "rgba(10,16,28,.96)",
                    border: "1px solid rgba(96,178,255,.24)",
                    borderRadius: 12,
                    boxShadow: "0 18px 40px rgba(0,0,0,.5)",
                    fontSize: 12,
                  }}
                  labelStyle={{
                    color: "#94a3bd",
                    fontSize: 11,
                    fontFamily: "var(--mono)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="repos"
                  stroke="url(#reposLine)"
                  strokeWidth={3}
                  dot={{
                    r: 3.5,
                    fill: "#08111f",
                    stroke: "#4de4ef",
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 6,
                    fill: "#4de4ef",
                    stroke: "#08111f",
                    strokeWidth: 3,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="glass card">
          <h2>Linguagens E Stacks</h2>
          <LanguageChart data={languageStats(repos)} />
        </section>
      </div>
    </div>
  );
}
