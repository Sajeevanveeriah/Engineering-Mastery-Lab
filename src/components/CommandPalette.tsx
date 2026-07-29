import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router";
import { searchCommandCatalogue } from "../data/catalogue";
import { Icon } from "./Icon";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onRequestNavigate: (route: string) => boolean;
}

export function CommandPalette({ open, onClose, onRequestNavigate }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const results = useMemo(() => searchCommandCatalogue(query), [query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => inputRef.current?.focus());
    const handle = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>("input, button, a[href]")];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handle);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", handle);
      previous?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;

  const choose = (route: string) => {
    if (!onRequestNavigate(route)) return;
    onClose();
    navigate(route);
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActive((index) => (index + direction + Math.max(results.length, 1)) % Math.max(results.length, 1));
    } else if (event.key === "Enter" && results[active]) {
      event.preventDefault();
      choose(results[active].route);
    }
  };

  return (
    <div className="palette-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div ref={dialogRef} className="command-palette" role="dialog" aria-modal="true" aria-labelledby="command-palette-title">
        <div className="command-palette__header">
          <Icon name="search" />
          <label id="command-palette-title" className="sr-only" htmlFor="global-search">Search Engineering Mastery Lab</label>
          <input
            ref={inputRef}
            id="global-search"
            value={query}
            onChange={(event) => { setQuery(event.target.value); setActive(0); }}
            onKeyDown={onInputKeyDown}
            placeholder="Search destinations, laboratories, pathways, projects, skills, and tools"
            autoComplete="off"
            aria-controls="global-search-results"
            aria-activedescendant={results[active] ? `search-result-${results[active].id}` : undefined}
          />
          <button className="icon-button" type="button" aria-label="Close search" onClick={onClose}><Icon name="close" /></button>
        </div>
        <p className="command-palette__hint">Use arrow keys to move, Enter to open, and Escape to close.</p>
        <div id="global-search-results" className="command-palette__results" role="listbox" aria-label="Search results">
          {results.map((result, index) => (
            <button
              id={`search-result-${result.id}`}
              key={result.id}
              type="button"
              role="option"
              aria-selected={active === index}
              className="command-result"
              onMouseEnter={() => setActive(index)}
              onClick={() => choose(result.route)}
            >
              <span>
                <strong>{result.title}</strong>
                <small>{result.description}</small>
              </span>
              <span className="command-result__meta"><b>{result.type}</b><small>{result.discipline}</small></span>
            </button>
          ))}
          {results.length === 0 && <div className="empty-state"><strong>No matching result</strong><p>Try a discipline, tool name, or engineering outcome.</p></div>}
        </div>
      </div>
    </div>
  );
}
