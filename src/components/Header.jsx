import SearchBar from "./SearchBar";

export default function Header({ onSearch }) {
  return (
    <header className="header glass">
      <div className="header-title">
        <p className="eyebrow">Developer workspace</p>
        <h1>GitHub Dev Dashboard</h1>
      </div>
      <SearchBar onSearch={onSearch} />
    </header>
  );
}
