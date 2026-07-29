import { Link, useParams } from "react-router";
import { PageHeader } from "../components/PageHeader";
import { rebootProjectReleases } from "../data/rebootCurriculum";
import { NotFoundPage } from "./NotFoundPage";

const releaseDetails = {
  P1: {
    interfaces: ["Versioned sensor-log schema", "Python and C++ module boundaries", "Repeatable local build and test command"],
    risks: ["Undocumented environment", "Frame or unit ambiguity", "A parser fault hidden by happy-path data"],
    tests: ["Fresh-clone build", "Unit and boundary cases", "One deliberate diagnosis"],
    evidence: ["System map", "Test log", "Short technical demonstration"]
  },
  P2: {
    interfaces: ["URDF/Xacro frame tree", "ros2_control command and state interfaces", "Differential-drive command timeout"],
    risks: ["Invalid inertia", "Broken TF", "Unbounded command or collision response"],
    tests: ["Connected TF tree", "Stable command response", "Stop timeout", "Collision case"],
    evidence: ["RViz and Gazebo capture with text equivalent", "Response metrics", "Acceptance table"]
  },
  P3: {
    interfaces: ["Timestamped odometry, IMU and LiDAR", "Map-odom-base transform ownership", "Nav2 mission and recovery result"],
    risks: ["Inconsistent covariance", "Localisation divergence", "Unsafe recovery or misleading success metric"],
    tests: ["Five fixed missions", "Pose and path metrics", "Blocked-path recovery", "Sensor-fault case"],
    evidence: ["Bag replay", "Benchmark table and plots", "Failure taxonomy"]
  },
  P4: {
    interfaces: ["Calibrated image and detection messages", "MCU motor-command timeout", "Diagnostics and release evidence graph"],
    risks: ["Dataset leakage", "Stale inference", "Unsafe actuator state", "Non-reproducible release"],
    tests: ["Held-out precision and recall", "End-to-end latency", "Command timeout", "Injected faults", "Clean reproduction"],
    evidence: ["Architecture", "Dataset and model provenance", "Failure gallery", "Benchmark", "90-second demonstration"]
  }
} as const;

export function RoverReleasePage() {
  const { releaseId = "" } = useParams();
  const release = rebootProjectReleases.find((candidate) => candidate.id === releaseId.toUpperCase());
  if (!release) return <NotFoundPage />;
  const details = releaseDetails[release.id];

  return (
    <section className="page release-detail-page">
      <PageHeader
        eyebrow={`${release.id} - ${release.sessions}`}
        title={release.name}
        description={release.userProblem}
        actions={<Link className="btn" to="/learn/reboot#release-heading">Back to rover releases</Link>}
      />
      <section className="release-increment"><p className="eyebrow">System increment</p><h2>{release.systemIncrement}</h2><p>{release.coreComponents}</p></section>
      <div className="release-review-grid">
        <section><h2>Interfaces</h2><ul>{details.interfaces.map((item) => <li key={item}>{item}</li>)}</ul></section>
        <section><h2>Risks</h2><ul>{details.risks.map((item) => <li key={item}>{item}</li>)}</ul></section>
        <section><h2>Acceptance tests</h2><ul>{details.tests.map((item) => <li key={item}>{item}</li>)}</ul><p><strong>Workbook wording:</strong> {release.acceptanceTests}</p></section>
        <section><h2>Evidence</h2><ul>{details.evidence.map((item) => <li key={item}>{item}</li>)}</ul><p><strong>Portfolio proof:</strong> {release.portfolioProof}</p></section>
      </div>
      <section className="spending-gate" aria-labelledby="spending-gate-heading">
        <p className="eyebrow">Gate before spending</p><h2 id="spending-gate-heading">{release.gateBeforeSpending}</h2>
        <p>Hardware required: {release.hardwareRequired}. A purchase is outside this local product and no payment or procurement capability is connected.</p>
      </section>
      <section><h2>Interview signal</h2><p>{release.interviewSignal}</p></section>
    </section>
  );
}
