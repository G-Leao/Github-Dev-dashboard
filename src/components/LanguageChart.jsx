export default function LanguageChart({ data }) {
  if (!data.length) return <p className="muted">Nenhuma linguagem detectada nos repositórios.</p>;
  return (
    <ul className="langs">
      {data.map((l) => (
        <li key={l.name}>
          <div className="lang-row"><span>{l.name}</span><span className="muted">{l.percent}%</span></div>
          <div className="bar"><div className="bar-fill" style={{ width: `${l.percent}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}
