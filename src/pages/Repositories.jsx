import { useMemo, useState } from "react";
import RepositoryCard from "../components/RepositoryCard";

const SORTS = {
  stars: (a, b) => b.stargazers_count - a.stargazers_count,
  recent: (a, b) => new Date(b.updated_at) - new Date(a.updated_at),
  name: (a, b) => a.name.localeCompare(b.name),
};

export default function Repositories({ repos, isFavorite, onToggle }) {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("all");
  const [sort, setSort] = useState("stars");

  const languages = useMemo(() => [...new Set(repos.map((r) => r.language).filter(Boolean))].sort(), [repos]);
  const list = useMemo(
    () =>
      repos
        .filter((r) => r.name.toLowerCase().includes(query.toLowerCase()))
        .filter((r) => language === "all" || r.language === language)
        .sort(SORTS[sort]),
    [repos, query, language, sort]
  );

  return (
    <div className="stack">
      <h2>Repositórios ({list.length})</h2>
      <div className="filters">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar repositório..." aria-label="Buscar repositório" />
        <select value={language} onChange={(e) => setLanguage(e.target.value)} aria-label="Linguagem">
          <option value="all">Todas as linguagens</option>
          {languages.map((l) => <option key={l}>{l}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Ordenar por">
          <option value="stars">Mais estrelas</option>
          <option value="recent">Mais recentes</option>
          <option value="name">Nome (A–Z)</option>
        </select>
      </div>
      {list.length === 0 ? (
        <p className="muted glass card">Nenhum repositório encontrado com esses filtros.</p>
      ) : (
        <div className="grid-cards">
          {list.map((r) => <RepositoryCard key={r.id} repo={r} isFavorite={isFavorite(r.id)} onToggle={onToggle} />)}
        </div>
      )}
    </div>
  );
}
