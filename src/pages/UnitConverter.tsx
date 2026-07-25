import { useMemo, useState } from "react";
import { PageHeader } from "../components/PageHeader";

type UnitDefinition = { id: string; label: string; toBase: (value: number) => number; fromBase: (value: number) => number };
const categories: Record<string, UnitDefinition[]> = {
  Length: [
    { id: "mm", label: "millimetres (mm)", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    { id: "m", label: "metres (m)", toBase: (v) => v, fromBase: (v) => v },
    { id: "km", label: "kilometres (km)", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    { id: "in", label: "inches (in)", toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 }
  ],
  Mass: [
    { id: "g", label: "grams (g)", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    { id: "kg", label: "kilograms (kg)", toBase: (v) => v, fromBase: (v) => v },
    { id: "t", label: "tonnes (t)", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    { id: "lb", label: "pounds (lb)", toBase: (v) => v * 0.45359237, fromBase: (v) => v / 0.45359237 }
  ],
  Pressure: [
    { id: "pa", label: "pascals (Pa)", toBase: (v) => v, fromBase: (v) => v },
    { id: "kpa", label: "kilopascals (kPa)", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    { id: "bar", label: "bar", toBase: (v) => v * 100000, fromBase: (v) => v / 100000 },
    { id: "psi", label: "pounds per square inch (psi)", toBase: (v) => v * 6894.757293168, fromBase: (v) => v / 6894.757293168 }
  ],
  Energy: [
    { id: "j", label: "joules (J)", toBase: (v) => v, fromBase: (v) => v },
    { id: "kj", label: "kilojoules (kJ)", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    { id: "wh", label: "watt-hours (Wh)", toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
    { id: "kwh", label: "kilowatt-hours (kWh)", toBase: (v) => v * 3_600_000, fromBase: (v) => v / 3_600_000 }
  ],
  Temperature: [
    { id: "c", label: "degrees Celsius", toBase: (v) => v + 273.15, fromBase: (v) => v - 273.15 },
    { id: "k", label: "kelvin (K)", toBase: (v) => v, fromBase: (v) => v },
    { id: "f", label: "degrees Fahrenheit", toBase: (v) => (v - 32) * 5 / 9 + 273.15, fromBase: (v) => (v - 273.15) * 9 / 5 + 32 }
  ]
};

export function UnitConverter() {
  const [category, setCategory] = useState("Length");
  const [input, setInput] = useState("1");
  const [from, setFrom] = useState("m");
  const [to, setTo] = useState("mm");
  const units = categories[category];
  const result = useMemo(() => {
    const value = Number(input);
    const source = units.find((unit) => unit.id === from) ?? units[0];
    const target = units.find((unit) => unit.id === to) ?? units[1] ?? units[0];
    if (!Number.isFinite(value)) return null;
    return target.fromBase(source.toBase(value));
  }, [from, input, to, units]);
  const changeCategory = (next: string) => {
    const nextUnits = categories[next];
    setCategory(next);
    setFrom(nextUnits[0].id);
    setTo((nextUnits[1] ?? nextUnits[0]).id);
  };
  return (
    <section className="page narrow-page">
      <PageHeader eyebrow="Local reference" title="Engineering unit converter" description="Convert through an SI base quantity. Raw values are retained for calculation and the display is rounded only at the end." />
      <form className="converter-panel" onSubmit={(event) => event.preventDefault()}>
        <div className="form-field"><label htmlFor="conversion-category">Quantity</label><select id="conversion-category" value={category} onChange={(event) => changeCategory(event.target.value)}>{Object.keys(categories).map((item) => <option key={item}>{item}</option>)}</select></div>
        <div className="form-grid form-grid--3">
          <div className="form-field"><label htmlFor="conversion-value">Value</label><input id="conversion-value" inputMode="decimal" value={input} onChange={(event) => setInput(event.target.value)} aria-invalid={result === null} /></div>
          <div className="form-field"><label htmlFor="conversion-from">From</label><select id="conversion-from" value={from} onChange={(event) => setFrom(event.target.value)}>{units.map((unit) => <option value={unit.id} key={unit.id}>{unit.label}</option>)}</select></div>
          <div className="form-field"><label htmlFor="conversion-to">To</label><select id="conversion-to" value={to} onChange={(event) => setTo(event.target.value)}>{units.map((unit) => <option value={unit.id} key={unit.id}>{unit.label}</option>)}</select></div>
        </div>
        <output className="conversion-result" aria-live="polite"><span>Converted value</span><strong>{result === null ? "Enter a finite number" : new Intl.NumberFormat("en-AU", { maximumSignificantDigits: 12 }).format(result)}</strong><small>{units.find((unit) => unit.id === to)?.label}</small></output>
      </form>
      <div className="safety-note safety-note--neutral"><p><strong>Method.</strong> Each value is converted to the category's SI base unit, then into the selected output unit. Temperature uses absolute kelvin internally. Verify consequential calculations independently.</p></div>
    </section>
  );
}
