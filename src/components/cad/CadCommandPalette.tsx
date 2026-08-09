import { useEffect, useRef } from "react";

export interface CadCommand {
  id: string;
  label: string;
  shortcut?: string;
  run: () => void;
}

interface CadCommandPaletteProps {
  open: boolean;
  commands: readonly CadCommand[];
  onClose: () => void;
}

export function CadCommandPalette({ open, commands, onClose }: CadCommandPaletteProps) {
  const firstRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    firstRef.current?.focus();
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  if (!open) return null;
  return (
    <div className="cad-ds-palette-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.currentTarget === event.target) onClose();
    }}>
      <section className="cad-ds-palette" role="dialog" aria-modal="true" aria-labelledby="cad-command-palette-heading">
        <header>
          <h2 id="cad-command-palette-heading">CAD commands</h2>
          <button type="button" className="cad-ds-icon-button" aria-label="Close command palette" onClick={onClose}>x</button>
        </header>
        <div role="list" aria-label="Available CAD commands">
          {commands.map((command, index) => (
            <button
              ref={index === 0 ? firstRef : undefined}
              key={command.id}
              type="button"
              role="listitem"
              onClick={() => {
                command.run();
                onClose();
              }}
            >
              <span>{command.label}</span>
              {command.shortcut && <kbd>{command.shortcut}</kbd>}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
