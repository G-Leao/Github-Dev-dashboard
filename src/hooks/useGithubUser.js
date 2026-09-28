import { useEffect, useState } from "react";
import { getUser, getRepos, getEvents } from "../services/githubApi";

export default function useGithubUser(username) {
  const [state, setState] = useState({ user: null, repos: [], events: [], loading: true, error: null });

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) setState((s) => ({ ...s, loading: true, error: null }));
    });

    Promise.all([getUser(username), getRepos(username), getEvents(username).catch(() => [])])
      .then(([user, repos, events]) => !cancelled && setState({ user, repos, events, loading: false, error: null }))
      .catch((err) => !cancelled && setState({ user: null, repos: [], events: [], loading: false, error: err.message }));

    return () => { cancelled = true; };
  }, [username]);

  return state;
}
