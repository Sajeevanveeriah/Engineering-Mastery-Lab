import { lazy, Suspense } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { ToolRouteBoundary } from "./components/ToolRouteBoundary";
import { WorkbenchProvider } from "./components/WorkbenchContext";
import { ProgressProvider } from "./components/ProgressContext";
import { LearnHub } from "./pages/LearnHub";
import { PathwayDetail } from "./pages/PathwayDetail";
import { Bookmarks } from "./pages/Bookmarks";
import { SkillsMatrix } from "./pages/SkillsMatrix";
import { PidLab } from "./pages/PidLab";
import { ElectricalLab } from "./pages/ElectricalLab";
import { EmbeddedLab } from "./pages/EmbeddedLab";
import { PlcLab } from "./pages/PlcLab";
import { RoboticsLab } from "./pages/RoboticsLab";
import { MlLab } from "./pages/MlLab";
import { MechanicalLab } from "./pages/MechanicalLab";
import { PracticeLab } from "./pages/PracticeLab";
import { Projects } from "./pages/Projects";
import { ProjectDetail } from "./pages/ProjectDetail";
import { ToolsHub } from "./pages/ToolsHub";
import { UnitConverter } from "./pages/UnitConverter";
import { MaterialsReference } from "./pages/MaterialsReference";
import { Portfolio } from "./pages/Portfolio";
import { Pricing } from "./pages/Pricing";
import { Settings } from "./pages/Settings";
import { About } from "./pages/About";
import { NotFoundPage } from "./pages/NotFoundPage";

const loadToolboxPage = () => import("./pages/ToolboxPage").then((module) => ({ default: module.ToolboxPage }));
const loadCadStudioPage = () => import("./pages/CadStudioPage").then((module) => ({ default: module.CadStudioPage }));
const loadWorkbenchPage = () => import("./pages/WorkbenchPage").then((module) => ({ default: module.WorkbenchPage }));
const loadDiagnosticsPage = () => import("./pages/DiagnosticsPage").then((module) => ({ default: module.DiagnosticsPage }));
const loadFlagshipWorkflowPage = () => import("./pages/FlagshipWorkflowPage").then((module) => ({ default: module.FlagshipWorkflowPage }));
const loadEngineeringWorkspacePage = () => import("./pages/EngineeringWorkspacePage").then((module) => ({ default: module.EngineeringWorkspacePage }));
const HomePage = lazy(() => import("./pages/Home").then((module) => ({ default: module.Home })));
const CurriculumRoadmapPage = lazy(() => import("./pages/CurriculumRoadmap").then((module) => ({ default: module.CurriculumRoadmap })));
const RebootRoadmapPage = lazy(() => import("./pages/RebootRoadmap").then((module) => ({ default: module.RebootRoadmap })));
const RebootSessionRoute = lazy(() => import("./pages/RebootSessionPage").then((module) => ({ default: module.RebootSessionPage })));
const MasteryModuleRoute = lazy(() => import("./pages/MasteryModulePage").then((module) => ({ default: module.MasteryModulePage })));
const CurriculumDiagnosticsRoute = lazy(() => import("./pages/CurriculumDiagnosticsPage").then((module) => ({ default: module.CurriculumDiagnosticsPage })));
const CurriculumResourcesRoute = lazy(() => import("./pages/CurriculumResourcesPage").then((module) => ({ default: module.CurriculumResourcesPage })));
const ProgressAnalysisRoute = lazy(() => import("./pages/ProgressAnalysisPage").then((module) => ({ default: module.ProgressAnalysisPage })));
const RoverReleaseRoute = lazy(() => import("./pages/RoverReleasePage").then((module) => ({ default: module.RoverReleasePage })));
const CapstoneEvidenceRoute = lazy(() => import("./pages/CapstoneEvidencePage").then((module) => ({ default: module.CapstoneEvidencePage })));

function LoadingRoute() {
  return <div className="page route-loading" role="status">Loading local capability...</div>;
}

const labRoutes = [
  ["pid", <PidLab key="pid" />],
  ["electrical", <ElectricalLab key="electrical" />],
  ["embedded", <EmbeddedLab key="embedded" />],
  ["plc", <PlcLab key="plc" />],
  ["robotics", <RoboticsLab key="robotics" />],
  ["ml", <MlLab key="ml" />],
  ["mechanical", <MechanicalLab key="mechanical" />],
  ["practice", <PracticeLab key="practice" />]
] as const;

export default function App() {
  return (
    <AppErrorBoundary>
      <ProgressProvider>
        <WorkbenchProvider>
          <HashRouter>
            <Suspense fallback={<LoadingRoute />}>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/learn" element={<LearnHub />} />
                  <Route path="/learn/roadmap" element={<CurriculumRoadmapPage />} />
                  <Route path="/learn/reboot" element={<RebootRoadmapPage />} />
                  <Route path="/learn/reboot/sessions/:sessionId" element={<RebootSessionRoute />} />
                  <Route path="/learn/modules/:moduleId" element={<MasteryModuleRoute />} />
                  <Route path="/learn/diagnostics" element={<CurriculumDiagnosticsRoute />} />
                  <Route path="/learn/resources" element={<CurriculumResourcesRoute />} />
                  <Route path="/learn/pathways" element={<LearnHub initialFormat="Pathway" />} />
                  <Route path="/learn/pathways/:pathwayId" element={<PathwayDetail />} />
                  <Route
                    path="/learn/flagships/:flagshipId"
                    element={<ToolRouteBoundary load={loadFlagshipWorkflowPage} toolName="Flagship engineering workflow" />}
                  />
                  <Route path="/learn/labs" element={<LearnHub initialFormat="Laboratory" />} />
                  {labRoutes.map(([id, element]) => <Route key={id} path={`/learn/labs/${id}`} element={element} />)}
                  <Route path="/learn/skills" element={<SkillsMatrix />} />
                  <Route path="/learn/bookmarks" element={<Bookmarks />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/projects/releases/:releaseId" element={<RoverReleaseRoute />} />
                  <Route path="/projects/:projectId" element={<ProjectDetail />} />
                  <Route path="/tools" element={<ToolsHub />} />
                  <Route
                    path="/tools/calculators"
                    element={<ToolRouteBoundary load={loadToolboxPage} toolName="Engineering Calculators" />}
                  />
                  <Route path="/tools/converter" element={<UnitConverter />} />
                  <Route path="/tools/materials" element={<MaterialsReference />} />
                  <Route path="/tools/progress" element={<ProgressAnalysisRoute />} />
                  <Route
                    path="/tools/engineering"
                    element={<ToolRouteBoundary load={loadEngineeringWorkspacePage} toolName="Engineering project workspace" />}
                  />
                  <Route
                    path="/tools/cad"
                    element={<ToolRouteBoundary load={loadCadStudioPage} toolName="CAD Studio" />}
                  />
                  <Route
                    path="/tools/workbench"
                    element={<ToolRouteBoundary load={loadWorkbenchPage} toolName="Project Workbench" />}
                  />
                  <Route
                    path="/tools/diagnostics"
                    element={<ToolRouteBoundary load={loadDiagnosticsPage} toolName="Desktop Diagnostics" />}
                  />
                  <Route path="/portfolio" element={<Portfolio />} />
                  <Route path="/portfolio/capstone" element={<CapstoneEvidenceRoute />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/about" element={<About />} />

                  <Route path="/labs" element={<Navigate to="/learn/labs" replace />} />
                  {labRoutes.map(([id]) => <Route key={`legacy-${id}`} path={`/labs/${id}`} element={<Navigate to={`/learn/labs/${id}`} replace />} />)}
                  <Route path="/skills" element={<Navigate to="/learn/skills" replace />} />
                  <Route path="/pathways" element={<Navigate to="/learn/pathways" replace />} />
                  <Route path="/toolbox" element={<Navigate to="/tools" replace />} />
                  <Route path="/cad" element={<Navigate to="/tools/cad" replace />} />
                  <Route path="/workbench" element={<Navigate to="/tools/workbench" replace />} />
                  <Route path="/diagnostics" element={<Navigate to="/tools/diagnostics" replace />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </Suspense>
          </HashRouter>
        </WorkbenchProvider>
      </ProgressProvider>
    </AppErrorBoundary>
  );
}
