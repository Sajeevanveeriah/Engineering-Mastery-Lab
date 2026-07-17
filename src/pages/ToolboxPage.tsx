import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EngineeringCalculator } from "../components/EngineeringCalculator";
import { Icon, type IconName } from "../components/Icon";
import { MaterialsTable } from "../components/MaterialsTable";
import { PageHeader } from "../components/PageHeader";
import { Tabs } from "../components/Tabs";
import { UnitConverter } from "../components/UnitConverter";
import { calculatorDefinitions, type EngineeringCategory } from "../lib/engineering/calculators";

const workflowLinks: Array<{ title: string; description: string; route: string; icon: IconName; tag: string }> = [
  { title: "Parametric CAD Studio", description: "Design plates, flanges, spacers and brackets with 3D inspection and manufacturing exports.", route: "/cad", icon: "cad", tag: "Design" },
  { title: "Project Workbench", description: "Link requirements, controlled inputs, analyses, run receipts and evidence reports.", route: "/workbench", icon: "workbench", tag: "Deliver" },
  { title: "PID Control Lab", description: "Tune closed-loop response and explore stability, noise and saturation.", route: "/labs/pid", icon: "control", tag: "Control" },
  { title: "Electrical Lab", description: "Circuit, filter, ADC and transient analysis with traceable challenges.", route: "/labs/electrical", icon: "electrical", tag: "Electrical" },
  { title: "PLC and SCADA Lab", description: "Interlocks, alarms, process simulation and FAT-ready controls practice.", route: "/labs/plc", icon: "plc", tag: "Automation" },
  { title: "Robotics Lab", description: "Mobile robot kinematics, odometry, planning and waypoint control.", route: "/labs/robotics", icon: "robotics", tag: "Robotics" },
  { title: "AI and ML Lab", description: "Regression, classification, anomaly detection and predictive maintenance.", route: "/labs/ml", icon: "ml", tag: "Data" },
  { title: "Systems and Practice Lab", description: "Requirements, FMEA, risk, FAT, SAT and decision records.", route: "/labs/practice", icon: "practice", tag: "Assurance" },
  { title: "Tool Diagnostics", description: "Check desktop capability and external ngspice and KiCad tools.", route: "/diagnostics", icon: "diagnostics", tag: "System" }
];

function CalculatorCatalogue() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<EngineeringCategory | "All">("All");
  const [selectedId, setSelectedId] = useState(calculatorDefinitions[0].id);
  const categories = ["All", ...new Set(calculatorDefinitions.map((tool) => tool.category))] as Array<EngineeringCategory | "All">;
  const filtered = useMemo(() => calculatorDefinitions.filter((tool) => {
    const search = query.trim().toLowerCase();
    return (category === "All" || tool.category === category)
      && (!search || `${tool.title} ${tool.category} ${tool.description}`.toLowerCase().includes(search));
  }), [category, query]);
  const selected = calculatorDefinitions.find((tool) => tool.id === selectedId) ?? calculatorDefinitions[0];

  return (
    <div className="toolbox-calculator-layout">
      <aside className="calculator-catalogue" aria-label="Calculator catalogue">
        <label className="search-field">
          <Icon name="search" size={17} />
          <span className="sr-only">Search calculators</span>
          <input type="search" placeholder="Search calculators" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label className="form-field">
          <span className="sr-only">Filter calculator category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value as EngineeringCategory | "All")}>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <div className="calculator-catalogue__list">
          {filtered.map((tool) => (
            <button
              key={tool.id}
              type="button"
              className={tool.id === selected.id ? "active" : ""}
              aria-pressed={tool.id === selected.id}
              onClick={() => setSelectedId(tool.id)}
            >
              <span>{tool.title}</span>
              <small>{tool.category}</small>
            </button>
          ))}
        </div>
        {filtered.length === 0 && <p className="compact-empty compact-empty--inline">No matching calculators.</p>}
      </aside>
      <EngineeringCalculator definition={selected} />
    </div>
  );
}

function WorkflowDirectory() {
  return (
    <section className="workflow-directory" aria-labelledby="workflow-directory-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Connected package</p>
          <h2 id="workflow-directory-heading">Engineering workflow directory</h2>
          <p>Move from concept and calculation into simulation, automation, verification and evidence.</p>
        </div>
      </div>
      <div className="tool-directory-grid">
        {workflowLinks.map((tool) => (
          <Link to={tool.route} className="tool-directory-card" key={tool.route}>
            <span className="tool-directory-card__icon"><Icon name={tool.icon} /></span>
            <span className="status-badge">{tool.tag}</span>
            <h3>{tool.title}</h3>
            <p>{tool.description}</p>
            <span className="tool-directory-card__action">Open tool <Icon name="arrow-right" size={16} /></span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function ToolboxPage() {
  return (
    <section className="page toolbox-page">
      <PageHeader
        eyebrow="Engineering analysis suite"
        title="Engineering Toolbox"
        description="Fast, unit-aware design calculations and reference data connected to the app's deeper laboratories, CAD workspace and evidence workflow."
        actions={<Link className="btn primary" to="/cad"><Icon name="cad" size={18} /> Open CAD Studio</Link>}
      />

      <div className="toolbox-summary" role="list" aria-label="Toolbox coverage">
        <div role="listitem"><strong>{calculatorDefinitions.length}</strong><span>validated calculators</span></div>
        <div role="listitem"><strong>12</strong><span>conversion dimensions</span></div>
        <div role="listitem"><strong>12</strong><span>material references</span></div>
        <div role="listitem"><strong>9</strong><span>connected workspaces</span></div>
      </div>

      <Tabs
        ariaLabel="Engineering toolbox sections"
        tabs={[
          { id: "calculators", label: "Calculators", content: <CalculatorCatalogue /> },
          { id: "converter", label: "Unit converter", content: <UnitConverter /> },
          { id: "materials", label: "Materials", content: <MaterialsTable /> },
          { id: "workflow", label: "All engineering tools", content: <WorkflowDirectory /> }
        ]}
      />

      <div className="safety-note" role="note">
        <Icon name="alert" size={20} />
        <p><strong>Engineering boundary.</strong> These tools support screening, learning and preliminary design. Verify inputs, equations, standards, material certificates, supplier data and safety factors before real-world use.</p>
      </div>
    </section>
  );
}
