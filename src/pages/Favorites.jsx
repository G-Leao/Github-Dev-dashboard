import RepositoryCard from "../components/RepositoryCard";

export default function Favorites({ favorites, onToggle }) {
  return (
    <div className="stack">
      <h2>Meus favoritos ({favorites.length})</h2>
      {favorites.length === 0 ? (
        <p className="muted glass card">Você ainda não favoritou nenhum projeto. Abra a aba Repos e clique na estrela.</p>
      ) : (
        <div className="grid-cards">
          {favorites.map((r) => <RepositoryCard key={r.id} repo={r} isFavorite onToggle={onToggle} />)}
        </div>
      )}
    </div>
  );
}
