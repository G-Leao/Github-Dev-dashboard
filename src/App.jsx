import { useState } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import LoadingSkeleton from "./components/LoadingSkeleton";
import Dashboard from "./pages/Dashboard";
import Repositories from "./pages/Repositories";
import Analytics from "./pages/Analytics";
import Favorites from "./pages/Favorites";
import useGithubUser from "./hooks/useGithubUser";
import useFavorites from "./hooks/useFavorites";
import AIOpinion from "./pages/AIOpinion";

const ERRORS = {
  USER_NOT_FOUND: [
    "Usuário não encontrado",
    "Verifique o nome e tente novamente.",
  ],
  RATE_LIMIT: [
    "Limite da API atingido",
    "O GitHub permite 60 requisições por hora sem token. Tente de novo mais tarde.",
  ],
};

export default function App() {
  const [username, setUsername] = useState("G-Leao");
  const [page, setPage] = useState("overview");
  const { user, repos, events, loading, error } = useGithubUser(username);
  const { favorites, isFavorite, toggle } = useFavorites();

  const search = (name) => {
    setUsername(name);
    setPage("overview");
  };

  function content() {
    if (page === "favorites")
      return <Favorites favorites={favorites} onToggle={toggle} />;

    if (loading) return <LoadingSkeleton />;

    if (error) {
      const [title, text] = ERRORS[error] || [
        "Não foi possível carregar",
        "Confira sua conexão e tente novamente.",
      ];

      return (
        <div className="glass card empty">
          <h2>:( {title}</h2>
          <p className="muted">{text}</p>

          <button
            className="btn"
            onClick={() => document.getElementById("search")?.focus()}
          >
            Nova busca
          </button>
        </div>
      );
    }

    if (page === "repos")
      return (
        <Repositories repos={repos} isFavorite={isFavorite} onToggle={toggle} />
      );

    if (page === "analytics")
      return <Analytics repos={repos} events={events} />;

    if (page === "ai")
      return (
        <AIOpinion key={user.login} user={user} repos={repos} events={events} />
      );

    return <Dashboard user={user} repos={repos} />;
  }

  return (
    <div className="app">
      <Sidebar page={page} onChange={setPage} />
      <main className="main">
        <Header onSearch={search} />
        <div className="content">{content()}</div>
      </main>
    </div>
  );
}
