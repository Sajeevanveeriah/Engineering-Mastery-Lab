import { useRef, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

interface CadPanelProps {
  id: string;
  title: string;
  eyebrow?: string;
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
  children: ReactNode;
}

export function CadPanel({ id, title, eyebrow, collapsed, onToggle, className = "", children }: CadPanelProps) {
  return (
    <section className={`cad-ds-panel ${collapsed ? "is-collapsed" : ""} ${className}`.trim()} aria-labelledby={`${id}-heading`}>
      <header className="cad-ds-panel__header">
        <div>
          {eyebrow && <span>{eyebrow}</span>}
          <h2 id={`${id}-heading`}>{title}</h2>
        </div>
        <button
          type="button"
          className="cad-ds-icon-button"
          aria-expanded={!collapsed}
          aria-controls={`${id}-body`}
          aria-label={`${collapsed ? "Expand" : "Collapse"} ${title}`}
          onClick={onToggle}
        >
          {collapsed ? "+" : "-"}
        </button>
      </header>
      <div id={`${id}-body`} className="cad-ds-panel__body" hidden={collapsed}>{children}</div>
    </section>
  );
}

interface CadResizeHandleProps {
  label: string;
  axis: "horizontal" | "vertical";
  value: number;
  min: number;
  max: number;
  reverse?: boolean;
  onChange: (value: number) => void;
}

export function CadResizeHandle({ label, axis, value, min, max, reverse = false, onChange }: CadResizeHandleProps) {
  const startRef = useRef<{ coordinate: number; value: number } | null>(null);
  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const coordinate = axis === "horizontal" ? event.clientX : event.clientY;
    startRef.current = { coordinate, value };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = startRef.current;
    if (!start || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const coordinate = axis === "horizontal" ? event.clientX : event.clientY;
    const delta = coordinate - start.coordinate;
    onChange(clamp(start.value + (reverse ? -delta : delta)));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const decrement = axis === "horizontal" ? event.key === "ArrowLeft" : event.key === "ArrowUp";
    const increment = axis === "horizontal" ? event.key === "ArrowRight" : event.key === "ArrowDown";
    if (!decrement && !increment) return;
    event.preventDefault();
    const delta = increment ? 16 : -16;
    onChange(clamp(value + (reverse ? -delta : delta)));
  };

  return (
    <div
      className={`cad-ds-resizer cad-ds-resizer--${axis}`}
      role="separator"
      tabIndex={0}
      aria-label={label}
      aria-orientation={axis === "horizontal" ? "vertical" : "horizontal"}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => {
        startRef.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={() => { startRef.current = null; }}
      onKeyDown={onKeyDown}
    />
  );
}
