export const formatNumber = (n = 0) => new Intl.NumberFormat("pt-BR").format(n);
export const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("pt-BR", {
        month: "short",
        year: "numeric",
      })
    : "";

export function totalStars(repos) {
  return repos.reduce((sum, r) => sum + r.stargazers_count, 0);
}

export function languageStats(repos) {
  const counts = repos.reduce((acc, r) => {
    if (r.language) acc[r.language] = (acc[r.language] || 0) + 1;
    return acc;
  }, {});
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(counts)
    .map(([name, count]) => ({
      name,
      count,
      percent: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

export function reposByYear(repos) {
  const counts = repos.reduce((acc, r) => {
    const y = new Date(r.created_at).getFullYear();
    acc[y] = (acc[y] || 0) + 1;
    return acc;
  }, {});
  return Object.keys(counts)
    .sort()
    .map((year) => ({ year, repos: counts[year] }));
}

export const topRepos = (repos, n = 5) =>
  [...repos]
    .sort(
      (a, b) =>
        b.stargazers_count - a.stargazers_count ||
        b.forks_count - a.forks_count,
    )
    .slice(0, n);

const dayKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function activityGrid(events, weeks = 8) {
  const counts = {};
  events.forEach((e) => {
    const k = dayKey(new Date(e.created_at));
    counts[k] = (counts[k] || 0) + 1;
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay() - (weeks - 1) * 7);
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = new Date(start);
      date.setDate(start.getDate() + w * 7 + d);
      const count = counts[dayKey(date)] || 0;
      return { date: dayKey(date), count, future: date > today };
    }),
  );
}
