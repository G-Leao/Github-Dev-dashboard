import { useEffect, useState } from "react";

const KEY = "devdash:favorites";

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}

export default function useFavorites() {
  const [favorites, setFavorites] = useState(load);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(favorites)); } catch { /* ignora */ }
  }, [favorites]);

  const isFavorite = (id) => favorites.some((f) => f.id === id);
  const toggle = (repo) =>
    setFavorites((list) =>
      list.some((f) => f.id === repo.id)
        ? list.filter((f) => f.id !== repo.id)
        : [...list, {
            id: repo.id, name: repo.name, description: repo.description, html_url: repo.html_url,
            language: repo.language, stargazers_count: repo.stargazers_count, forks_count: repo.forks_count,
          }]
    );

  return { favorites, isFavorite, toggle };
}
