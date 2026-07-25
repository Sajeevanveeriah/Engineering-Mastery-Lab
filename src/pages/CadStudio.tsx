import { useMemo, useState } from "react";
import { PageHeader } from "../components/PageHeader";

export function CadStudio() {
  const [width, setWidth] = useState(120);
  const [height, setHeight] = useState(80);
  const [margin, setMargin] = useState(12);
  const [holeDiameter, setHoleDiameter] = useState(6);
  const valid = width >= 40 && width <= 500 && height >= 40 && height <= 500 && margin >= 5 && margin * 2 < Math.min(width, height) && holeDiameter >= 1 && holeDiameter < margin;
  const holes = useMemo(() => [[margin, margin], [width - margin, margin], [width - margin, height - margin], [margin, height - margin]], [height, margin, width]);
  const svg = valid ? `<svg xmlns="http://www.w3.org/2000/svg" width="${width}mm" height="${height}mm" viewBox="0 0 ${width} ${height}"><title>Parametric mounting plate concept</title><rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="4" fill="none" stroke="black"/>${holes.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${holeDiameter / 2}" fill="none" stroke="black"/>`).join("")}</svg>` : "";
  const download = () => {
    if (!valid) return;
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `mounting-concept-${width}x${height}mm.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <section className="page">
      <PageHeader eyebrow="Dependency-free local concept tool" title="CAD Studio" description="Create a dimension-driven 2D mounting concept. This newly added route is lazy-loaded and does not add a Three.js or remote dependency." />
      <div className="cad-layout">
        <form className="cad-controls" onSubmit={(event) => event.preventDefault()}>
          <h2>Parameters</h2>
          <div className="form-field"><label htmlFor="cad-width">Width (mm)</label><input id="cad-width" type="number" min={40} max={500} value={width} onChange={(event) => setWidth(Number(event.target.value))} /></div>
          <div className="form-field"><label htmlFor="cad-height">Height (mm)</label><input id="cad-height" type="number" min={40} max={500} value={height} onChange={(event) => setHeight(Number(event.target.value))} /></div>
          <div className="form-field"><label htmlFor="cad-margin">Hole centre margin (mm)</label><input id="cad-margin" type="number" min={5} value={margin} onChange={(event) => setMargin(Number(event.target.value))} /></div>
          <div className="form-field"><label htmlFor="cad-hole">Hole diameter (mm)</label><input id="cad-hole" type="number" min={1} step={0.5} value={holeDiameter} onChange={(event) => setHoleDiameter(Number(event.target.value))} /></div>
          {!valid && <p className="inline-message inline-message--error" role="alert">Keep both sides from 40 to 500 mm, the margin within the plate, and the hole diameter smaller than the margin.</p>}
          <button className="primary" type="button" disabled={!valid} onClick={download}>Export SVG concept</button>
        </form>
        <section className="cad-canvas" aria-labelledby="cad-preview-heading">
          <div className="section-heading"><div><p className="eyebrow">Live view</p><h2 id="cad-preview-heading">Mounting plate concept</h2></div><span>{width} x {height} mm</span></div>
          {valid && <svg role="img" aria-label={`Rectangular ${width} by ${height} millimetre mounting plate with four ${holeDiameter} millimetre holes`} viewBox={`-10 -10 ${width + 20} ${height + 20}`}>
            <rect x={0} y={0} width={width} height={height} rx={4} />
            {holes.map(([x, y], index) => <circle key={index} cx={x} cy={y} r={holeDiameter / 2} />)}
            <path d={`M0 ${height + 5}H${width}`} /><path d={`M-5 0V${height}`} />
          </svg>}
          <dl className="inline-facts"><div><dt>Edge clearance</dt><dd>{margin - holeDiameter / 2} mm</dd></div><div><dt>Hole centres</dt><dd>{width - margin * 2} x {height - margin * 2} mm</dd></div></dl>
        </section>
      </div>
      <div className="safety-note"><p><strong>Concept boundary.</strong> SVG output is a learner-generated 2D concept, not manufacturing-certified CAD. Verify loads, material, thickness, tolerances, edge distances, fasteners, and fabrication constraints independently.</p></div>
    </section>
  );
}
