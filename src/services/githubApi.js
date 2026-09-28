const BASE_URL = "https://api.github.com";

async function request(path) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (response.status === 404) throw new Error("USER_NOT_FOUND");
  if (response.status === 403) throw new Error("RATE_LIMIT");
  if (!response.ok) throw new Error("REQUEST_FAILED");
  return response.json();
}

const enc = encodeURIComponent;
export const getUser = (u) => request(`/users/${enc(u)}`);
export const getRepos = (u) => request(`/users/${enc(u)}/repos?per_page=100&sort=updated`);
export const getEvents = (u) => request(`/users/${enc(u)}/events/public?per_page=100`);
