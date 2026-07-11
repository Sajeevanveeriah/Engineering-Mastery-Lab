import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}

export interface SliderDraftResolution {
  draft: string;
  value: number;
  notifyChange: boolean;
}

export function resolveSliderDraft(
  draft: string,
  currentValue: number,
  min: number,
  max: number,
  cancelled: boolean
): SliderDraftResolution {
  if (cancelled) return { draft: String(currentValue), value: currentValue, notifyChange: false };
  const parsed = Number(draft);
  if (draft.trim() === "" || !Number.isFinite(parsed)) {
    return { draft: String(currentValue), value: currentValue, notifyChange: false };
  }
  const next = Math.min(max, Math.max(min, parsed));
  return { draft: String(next), value: next, notifyChange: true };
}

export function Slider({ label, value, min, max, step, unit, onChange }: SliderProps) {
  const reactId = useId().replace(/:/g, "");
  const id = `slider-${label.replace(/\W+/g, "-").toLowerCase()}-${reactId}`;
  const valueText = `${formatEngineeringNumber(value, step)}${unit ? ` ${unit}` : ""}`;
  const [draft, setDraft] = useState(String(value));
  const cancelNextBlur = useRef(false);
  const parsedDraft = Number(draft);
  const draftInvalid = draft.trim() === "" || !Number.isFinite(parsedDraft);

  useEffect(() => setDraft(String(value)), [value]);

  const commitDraft = () => {
    const resolution = resolveSliderDraft(draft, value, min, max, cancelNextBlur.current);
    cancelNextBlur.current = false;
    setDraft(resolution.draft);
    if (resolution.notifyChange) onChange(resolution.value);
  };

  const onPreciseKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") event.currentTarget.blur();
    if (event.key === "Escape") {
      event.preventDefault();
      cancelNextBlur.current = true;
      setDraft(String(value));
      event.currentTarget.blur();
    }
  };

  return (
    <div className="slider-row">
      <div className="slider-row__header">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id} className="value">
          {valueText}
        </output>
      </div>
      <div className="slider-row__controls">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-valuetext={valueText}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <div className="number-input">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={draft}
            aria-label={`${label} precise value${unit ? ` in ${unit}` : ""}`}
            aria-invalid={draftInvalid || undefined}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commitDraft}
            onKeyDown={onPreciseKeyDown}
          />
          {unit && <span aria-hidden="true">{unit}</span>}
        </div>
      </div>
    </div>
  );
}

function formatEngineeringNumber(value: number, step: number): string {
  if (Math.abs(value) >= 100_000 || (Math.abs(value) > 0 && Math.abs(value) < 0.001)) {
    return value.toExponential(3);
  }
  const decimalPart = String(step).split(".")[1];
  const decimals = decimalPart ? Math.min(decimalPart.length, 6) : 0;
  return Number(value.toFixed(decimals)).toLocaleString("en-AU", { maximumFractionDigits: decimals });
}
