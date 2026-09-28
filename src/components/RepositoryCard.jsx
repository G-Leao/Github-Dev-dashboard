import { formatNumber } from "../utils/formatters";

export default function RepositoryCard({ repo, isFavorite, onToggle }) {
  return (
    <article className="repo glass">
      <div className="repo-top">
        <h3>📦 {repo.name}</h3>
        <button className={`fav ${isFavorite ? "on" : ""}`} onClick={() => onToggle(repo)}
          aria-pressed={isFavorite} aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}>
          {isFavorite ? "★" : "☆"}
        </button>
      </div>
      <p className="muted">{repo.description || "Sem descrição."}</p>
      <div className="repo-meta muted">
        {repo.language && <span>● {repo.language}</span>}
        <span>⭐ {formatNumber(repo.stargazers_count)}</span>
        <span>🍴 {formatNumber(repo.forks_count)}</span>
      </div>
      <a className="btn ghost" href={repo.html_url} target="_blank" rel="noreferrer">Ver no GitHub</a>
    </article>
  );
}
