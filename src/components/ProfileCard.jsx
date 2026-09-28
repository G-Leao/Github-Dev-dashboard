import { formatDate } from "../utils/formatters";

export default function ProfileCard({ user }) {
  return (
    <section className="profile glass">
      <img src={user.avatar_url} alt={`Avatar de ${user.login}`} width="96" height="96" />
      <div>
        <h2>{user.name || user.login}</h2>
        <a href={user.html_url} target="_blank" rel="noreferrer">@{user.login}</a>
        {user.bio && <p>{user.bio}</p>}
        <ul className="meta muted">
          {user.location && <li>📍 {user.location}</li>}
          {user.company && <li>🏢 {user.company}</li>}
          {user.blog && (
            <li>🔗 <a href={user.blog.startsWith("http") ? user.blog : `https://${user.blog}`} target="_blank" rel="noreferrer">{user.blog}</a></li>
          )}
          <li>📅 No GitHub desde {formatDate(user.created_at)}</li>
        </ul>
      </div>
    </section>
  );
}
