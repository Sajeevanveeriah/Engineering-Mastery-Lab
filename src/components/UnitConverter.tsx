import { useMemo, useState } from "react";
import { convertUnit, unitCategories } from "../lib/engineering/units";
import { Icon } from "./Icon";

function displayValue(value: number): string {
  if (!Number.isFinite(value)) return "Invalid input";
  const magnitude = Math.abs(value);
  if ((magnitude > 0 && magnitude < 1e-6) || magnitude >= 1e9) return value.toExponential(8);
  return new Intl.NumberFormat("en-AU", { maximumSignificantDigits: 12 }).format(value);
}

export function UnitConverter() {
  const [categoryId, setCategoryId] = useState("length");
  const category = unitCategories.find((item) => item.id === categoryId) ?? unitCategories[0];
  const [sourceId, setSourceId] = useState("m");
  const [targetId, setTargetId] = useState("mm");
  const [value, setValue] = useState(1);

  const source = category.units.find((unit) => unit.id === sourceId) ?? category.units[0];
  const target = category.units.find((unit) => unit.id === targetId) ?? category.units[1] ?? category.units[0];
  const result = useMemo(() => {
    try {
      return convertUnit(category.id, value, source.id, target.id);
    } catch {
      return Number.NaN;
    }
  }, [category.id, source.id, target.id, value]);

  const chooseCategory = (nextId: string) => {
    const next = unitCategories.find((item) => item.id === nextId) ?? unitCategories[0];
    setCategoryId(next.id);
    setSourceId(next.units[0].id);
    setTargetId((next.units[1] ?? next.units[0]).id);
  };

  const swap = () => {
    setSourceId(target.id);
    setTargetId(source.id);
    if (Number.isFinite(result)) setValue(result);
  };

  return (
    <section className="converter-card" aria-labelledby="unit-converter-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">SI-based conversion engine</p>
          <h2 id="unit-converter-heading">Engineering unit converter</h2>
          <p>Convert only within the same physical dimension, including affine temperature scales.</p>
        </div>
      </div>
      <div className="converter-grid">
        <label className="form-field converter-grid__category">
          <span>Quantity</span>
          <select value={category.id} onChange={(event) => chooseCategory(event.target.value)}>
            {unitCategories.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label className="form-field">
          <span>From</span>
          <select value={source.id} onChange={(event) => setSourceId(event.target.value)}>
            {category.units.map((unit) => <option value={unit.id} key={unit.id}>{unit.label} ({unit.symbol})</option>)}
          </select>
        </label>
        <label className="form-field">
          <span>Value</span>
          <input type="number" value={Number.isNaN(value) ? "" : value} onChange={(event) => setValue(event.currentTarget.value === "" ? Number.NaN : event.currentTarget.valueAsNumber)} />
        </label>
        <button className="icon-button converter-grid__swap" type="button" aria-label="Swap source and target units" onClick={swap}>
          <Icon name="refresh" size={19} />
        </button>
        <label className="form-field">
          <span>To</span>
          <select value={target.id} onChange={(event) => setTargetId(event.target.value)}>
            {category.units.map((unit) => <option value={unit.id} key={unit.id}>{unit.label} ({unit.symbol})</option>)}
          </select>
        </label>
        <output className="converter-output" aria-live="polite">
          <span>Converted value</span>
          <strong>{displayValue(result)}</strong>
          <small>{target.symbol}</small>
        </output>
      </div>
    </section>
  );
}
