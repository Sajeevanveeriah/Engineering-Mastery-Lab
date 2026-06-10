interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}

export function Slider({ label, value, min, max, step, unit, onChange }: SliderProps) {
  const id = `slider-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div className="slider-row">
      <label htmlFor={id}>
        {label}
        <span className="value">
          {Number(value.toFixed(4))}
          {unit ? ` ${unit}` : ""}
        </span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
