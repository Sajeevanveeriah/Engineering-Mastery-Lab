import { useEffect, useMemo, useState } from "react";
import { Icon } from "./Icon";
import {
  EngineeringInputError,
  calculateById,
  defaultInputs,
  type CalculatorDefinition,
  type CalculatorOutput
} from "../lib/engineering/calculators";

interface EngineeringCalculatorProps {
  definition: CalculatorDefinition;
}

function formatEngineeringValue(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return "Invalid";
  const magnitude = Math.abs(value);
  if ((magnitude !== 0 && magnitude < 0.001) || magnitude >= 1e7) return value.toExponential(Math.min(digits, 6));
  return new Intl.NumberFormat("en-AU", { maximumFractionDigits: digits }).format(value);
}

function downloadRecord(definition: CalculatorDefinition, inputs: Record<string, number>, output: CalculatorOutput): void {
  const record = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    calculator: {
      id: definition.id,
      title: definition.title,
      category: definition.category,
      equation: definition.equation
    },
    inputs: definition.fields.map((field) => ({
      id: field.id,
      label: field.label,
      value: inputs[field.id],
      unit: field.unit
    })),
    results: output.values,
    assumptions: definition.assumptions,
    warnings: output.warnings ?? [],
    boundary: "Preliminary engineering calculation. Independently verify before design or field use."
  };
  const blob = new Blob([JSON.stringify(record, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${definition.id}-calculation-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function EngineeringCalculator({ definition }: EngineeringCalculatorProps) {
  const [inputs, setInputs] = useState<Record<string, number>>(() => defaultInputs(definition));

  useEffect(() => {
    setInputs(defaultInputs(definition));
  }, [definition]);

  const calculation = useMemo<{ output: CalculatorOutput | null; error: string | null }>(() => {
    try {
      return { output: calculateById(definition.id, inputs), error: null };
    } catch (error) {
      return {
        output: null,
        error: error instanceof EngineeringInputError || error instanceof Error
          ? error.message
          : "Calculation could not be completed."
      };
    }
  }, [definition, inputs]);

  return (
    <section className="calculator-workspace" aria-labelledby="active-calculator-title">
      <header className="calculator-workspace__header">
        <div>
          <p className="eyebrow">{definition.category}</p>
          <h2 id="active-calculator-title">{definition.title}</h2>
          <p>{definition.description}</p>
        </div>
        <button
          className="btn"
          type="button"
          disabled={!calculation.output}
          onClick={() => calculation.output && downloadRecord(definition, inputs, calculation.output)}
        >
          <Icon name="download" size={17} /> Export record
        </button>
      </header>

      <div className="calculator-layout">
        <form className="calculator-inputs" onSubmit={(event) => event.preventDefault()}>
          <div className="section-heading">
            <div>
              <h3>Inputs</h3>
              <p className="small muted">All calculations use SI internally. Enter the units shown.</p>
            </div>
            <button className="btn btn--quiet" type="button" onClick={() => setInputs(defaultInputs(definition))}>Reset</button>
          </div>
          <div className="form-grid form-grid--2">
            {definition.fields.map((field) => (
              <label className="form-field" key={field.id}>
                <span>{field.label}</span>
                <span className="quantity-input">
                  <input
                    type="number"
                    value={Number.isNaN(inputs[field.id]) ? "" : inputs[field.id]}
                    min={field.min}
                    max={field.max}
                    step={field.step ?? "any"}
                    onChange={(event) => setInputs((current) => ({
                      ...current,
                      [field.id]: event.currentTarget.value === "" ? Number.NaN : event.currentTarget.valueAsNumber
                    }))}
                  />
                  {field.unit && <span>{field.unit}</span>}
                </span>
                {field.help && <small>{field.help}</small>}
              </label>
            ))}
          </div>
        </form>

        <div className="calculator-results" aria-live="polite">
          <div className="section-heading">
            <div>
              <h3>Calculated result</h3>
              <p className="calculator-equation"><code>{definition.equation}</code></p>
            </div>
          </div>
          {calculation.error ? (
            <div className="inline-message inline-message--error" role="alert"><Icon name="alert" size={18} /> {calculation.error}</div>
          ) : (
            <>
              <dl className="result-metric-grid">
                {calculation.output?.values.map((result) => (
                  <div key={`${result.label}-${result.unit}`}>
                    <dt>{result.label}</dt>
                    <dd>{formatEngineeringValue(result.value, result.digits)} <span>{result.unit}</span></dd>
                  </div>
                ))}
              </dl>
              {calculation.output?.warnings?.map((warning) => (
                <div className="inline-message inline-message--neutral" role="note" key={warning}>
                  <Icon name="alert" size={18} /> {warning}
                </div>
              ))}
            </>
          )}
          <div className="assumption-panel">
            <strong>Model assumptions</strong>
            <ul>{definition.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}</ul>
          </div>
        </div>
      </div>
    </section>
  );
}
