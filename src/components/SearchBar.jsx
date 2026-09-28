import { useState } from "react";

export default function SearchBar({ onSearch }) {
  const [value, setValue] = useState("");
  const submit = (event) => {
    event.preventDefault();
    if (value.trim()) onSearch(value.trim());
  };

  return (
    <form className="search" onSubmit={submit} role="search">
      <label className="search-input" htmlFor="search">
        <span aria-hidden="true">⌕</span>
        <input id="search" value={value} onChange={(event) => setValue(event.target.value)}
          placeholder="Buscar desenvolvedor (ex: octocat)" aria-label="Buscar desenvolvedor" />
      </label>
      <button type="submit" className="btn">Buscar</button>
    </form>
  );
}
