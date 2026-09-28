import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import ProfileCard from "../components/ProfileCard";
import StatCard from "../components/StatCard";
import LanguageChart from "../components/LanguageChart";
import { formatNumber, totalStars, languageStats, reposByYear } from "../utils/formatters";

export default function Dashboard({ user, repos }) {
  const years = reposByYear(repos);
  return (
    <div className="stack">
      <ProfileCard user={user} />
      <div className="grid-3">
        <StatCard icon="📦" value={formatNumber(user.public_repos)} label="Repositórios" />
        <StatCard icon="👥" value={formatNumber(user.followers)} label="Seguidores" />
        <StatCard icon="⭐" value={formatNumber(totalStars(repos))} label="Stars recebidas" />
      </div>
      <div className="grid-2">
        <section className="glass card">
          <h2>Repositórios ao longo do tempo</h2>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={years}>
                <CartesianGrid stroke="rgba(255,255,255,.08)" />
                <XAxis dataKey="year" stroke="#94a3b8" />
                <YAxis allowDecimals={false} stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: "#0b1733", border: "1px solid #1e3a8a", borderRadius: 8 }} />
                <Line type="monotone" dataKey="repos" stroke="#60a5fa" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="glass card">
          <h2>Linguagens</h2>
          <LanguageChart data={languageStats(repos)} />
        </section>
      </div>
    </div>
  );
}
