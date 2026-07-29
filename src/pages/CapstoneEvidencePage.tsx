import { Link } from "react-router";
import { PageHeader } from "../components/PageHeader";
import { useProgress } from "../components/ProgressContext";
import { masteryModules } from "../data/masteryCurriculum";
import { rebootProjectReleases, rebootSessions } from "../data/rebootCurriculum";

export function CapstoneEvidencePage() {
  const { progress } = useProgress();
  const capstone = masteryModules.find((module) => module.id === "EML-E4-D25")!;
  const release = rebootProjectReleases[rebootProjectReleases.length - 1];
  const finalSession = rebootSessions[rebootSessions.length - 1];
  const capstoneRecord = progress.curriculumRecords[capstone.id];
  const releaseRecord = progress.curriculumRecords[finalSession.id];

  const rows = [
    ["Problem and requirements", "Unique measurable requirements and exclusions", "Requirements set and traceability matrix"],
    ["Architecture and interfaces", "System boundaries, frames, timing, data and energy interfaces", "Architecture and interface control record"],
    ["Risk and safe states", "FMEA, cybersecurity boundary and verified mitigations", "Risk register, fault tests and residual decisions"],
    ["Implementation", release.systemIncrement, "Source revision, build record and configuration"],
    ["Verification and validation", release.acceptanceTests, "Test procedures, raw results, deviations and replayable evidence"],
    ["Communication", "Defend decisions, limitations, ethics, sustainability and cost", "README, benchmark report, demonstration and question log"]
  ];

  return (
    <section className="page capstone-page">
      <PageHeader
        eyebrow="E4 R&D mastery and proof"
        title="Defensible rover capstone"
        description="A capstone is complete only when material claims trace to retained evidence, limitations remain visible and an independent reviewer can reproduce a key result."
        actions={<Link className="btn" to={`/learn/modules/${capstone.id}`}>Open professional capstone module</Link>}
      />

      <div className="capstone-status">
        <article><span>Professional module</span><strong>{capstoneRecord?.gateResult === "passed" ? "Gate passed" : "Not yet verified"}</strong><small>{capstone.id}</small></article>
        <article><span>Reboot release</span><strong>{releaseRecord?.gateResult === "passed" ? "Gate passed" : "Not yet verified"}</strong><small>{finalSession.id}</small></article>
        <article><span>Evidence references</span><strong>{(capstoneRecord?.evidenceReferences.length ?? 0) + (releaseRecord?.evidenceReferences.length ?? 0)}</strong><small>Local curriculum records</small></article>
      </div>

      <section aria-labelledby="traceability-heading">
        <p className="eyebrow">Requirements-to-test traceability</p><h2 id="traceability-heading">Capstone evidence matrix</h2>
        <div className="table-wrap">
          <table>
            <caption>Required capstone claims and evidence</caption>
            <thead><tr><th scope="col">Claim area</th><th scope="col">Acceptance basis</th><th scope="col">Required retained proof</th></tr></thead>
            <tbody>{rows.map(([area, basis, proof]) => <tr key={area}><th scope="row">{area}</th><td>{basis}</td><td>{proof}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="evidence-graph" aria-labelledby="evidence-graph-heading">
        <p className="eyebrow">Accessible system flow</p><h2 id="evidence-graph-heading">Evidence lineage</h2>
        <ol>
          <li><strong>Need</strong><span>Why the rover exists and who is affected</span></li>
          <li><strong>Requirement</strong><span>Measurable behaviour and exclusions</span></li>
          <li><strong>Decision</strong><span>Architecture, trade-off and risk basis</span></li>
          <li><strong>Test</strong><span>Procedure, input, environment and expected result</span></li>
          <li><strong>Result</strong><span>Raw output, pass or fail and deviation</span></li>
          <li><strong>Claim</strong><span>Narrow conclusion, limitation and residual risk</span></li>
        </ol>
        <p>Text equivalent: each portfolio claim traces backwards through result, test, decision and requirement to the original stakeholder need.</p>
      </section>

      <section className="mastery-gate"><p className="eyebrow">Release gate</p><h2>{capstone.masteryGate}</h2><p>{capstone.evidenceRequirement}</p></section>
    </section>
  );
}
