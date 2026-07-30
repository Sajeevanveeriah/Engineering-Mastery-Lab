import { useEffect, useId, useMemo, useState } from "react";
import { calculatorMathExpressions } from "../data/mathExpressions";
import { Icon } from "./Icon";
import { Equation } from "./AcademyMath";
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
  const componentId = useId();
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
  const calculationErrorId = `${componentId}-calculation-error`;
  const inputHeadingId = `${componentId}-input-heading`;
  const resultHeadingId = `${componentId}-result-heading`;
  const invalidFieldIds = useMemo(() => {
    if (!calculation.error) return new Set<string>();
    const errorText = calculation.error.toLocaleLowerCase("en-AU");
    const invalid = new Set(
      definition.fields
        .filter((field) => {
          const value = inputs[field.id];
          return !Number.isFinite(value)
            || (field.min !== undefined && value < field.min)
            || (field.max !== undefined && value > field.max)
            || errorText.includes(field.label.toLocaleLowerCase("en-AU"));
        })
        .map((field) => field.id)
    );
    if (invalid.size === 0) definition.fields.forEach((field) => invalid.add(field.id));
    return invalid;
  }, [calculation.error, definition.fields, inputs]);

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
        <form className="calculator-inputs" aria-labelledby={inputHeadingId} onSubmit={(event) => event.preventDefault()}>
          <div className="section-heading">
            <div>
              <h3 id={inputHeadingId}>Inputs</h3>
              <p className="small muted">All calculations use SI internally. Enter the units shown.</p>
            </div>
            <button className="btn btn--quiet" type="button" onClick={() => setInputs(defaultInputs(definition))}>Reset</button>
          </div>
          <div className="form-grid form-grid--2">
            {definition.fields.map((field) => {
              const fieldId = `${componentId}-${field.id}`;
              const helpId = field.help ? `${fieldId}-help` : undefined;
              const unitId = field.unit ? `${fieldId}-unit` : undefined;
              const invalid = invalidFieldIds.has(field.id);
              const describedBy = [unitId, helpId, invalid ? calculationErrorId : undefined].filter(Boolean).join(" ") || undefined;
              return (
                <div className="form-field" key={field.id}>
                  <label htmlFor={fieldId}>{field.label}</label>
                  <span className="quantity-input">
                    <input
                      id={fieldId}
                      name={field.id}
                      type="number"
                      value={Number.isNaN(inputs[field.id]) ? "" : inputs[field.id]}
                      min={field.min}
                      max={field.max}
                      step={field.step ?? "any"}
                      required
                      aria-invalid={invalid || undefined}
                      aria-errormessage={invalid ? calculationErrorId : undefined}
                      aria-describedby={describedBy}
                      onChange={(event) => {
                        const nextValue = event.currentTarget.value === "" ? Number.NaN : event.currentTarget.valueAsNumber;
                        setInputs((current) => ({ ...current, [field.id]: nextValue }));
                      }}
                    />
                    {field.unit && <span id={unitId}>{field.unit}</span>}
                  </span>
                  {field.help && <small id={helpId}>{field.help}</small>}
                </div>
              );
            })}
          </div>
        </form>

        <div className="calculator-results" role="region" aria-labelledby={resultHeadingId}>
          <div className="section-heading">
            <div>
              <h3 id={resultHeadingId}>Calculated result</h3>
              <Equation
                className="calculator-equation"
                expression={
                  calculatorMathExpressions[
                    definition.id as keyof typeof calculatorMathExpressions
                  ]
                }
                fallbackText={definition.equation}
                label={`${definition.title} equations`}
              />
            </div>
          </div>
          {calculation.error ? (
            <div id={calculationErrorId} className="inline-message inline-message--error" role="alert"><Icon name="alert" size={18} /> {calculation.error}</div>
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
