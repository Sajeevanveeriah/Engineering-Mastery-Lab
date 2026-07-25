import { lazy, Suspense } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { WorkbenchProvider } from "./components/WorkbenchContext";
import { ProgressProvider } from "./components/ProgressContext";
import { Home } from "./pages/Home";
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
import { CalculatorHub } from "./pages/CalculatorHub";
import { UnitConverter } from "./pages/UnitConverter";
import { MaterialsReference } from "./pages/MaterialsReference";
import { Portfolio } from "./pages/Portfolio";
import { Pricing } from "./pages/Pricing";
import { Settings } from "./pages/Settings";
import { About } from "./pages/About";
import { NotFoundPage } from "./pages/NotFoundPage";

const CadStudio = lazy(() => import("./pages/CadStudio").then((module) => ({ default: module.CadStudio })));
const WorkbenchPage = lazy(() => import("./pages/WorkbenchPage").then((module) => ({ default: module.WorkbenchPage })));
const DiagnosticsPage = lazy(() => import("./pages/DiagnosticsPage").then((module) => ({ default: module.DiagnosticsPage })));

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
                  <Route path="/" element={<Home />} />
                  <Route path="/learn" element={<LearnHub />} />
                  <Route path="/learn/pathways" element={<LearnHub initialFormat="Pathway" />} />
                  <Route path="/learn/pathways/:pathwayId" element={<PathwayDetail />} />
                  <Route path="/learn/labs" element={<LearnHub initialFormat="Laboratory" />} />
                  {labRoutes.map(([id, element]) => <Route key={id} path={`/learn/labs/${id}`} element={element} />)}
                  <Route path="/learn/skills" element={<SkillsMatrix />} />
                  <Route path="/learn/bookmarks" element={<Bookmarks />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/projects/:projectId" element={<ProjectDetail />} />
                  <Route path="/tools" element={<ToolsHub />} />
                  <Route path="/tools/calculators" element={<CalculatorHub />} />
                  <Route path="/tools/converter" element={<UnitConverter />} />
                  <Route path="/tools/materials" element={<MaterialsReference />} />
                  <Route path="/tools/cad" element={<CadStudio />} />
                  <Route path="/tools/workbench" element={<WorkbenchPage />} />
                  <Route path="/tools/diagnostics" element={<DiagnosticsPage />} />
                  <Route path="/portfolio" element={<Portfolio />} />
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
