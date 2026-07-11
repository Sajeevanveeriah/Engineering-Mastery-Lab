import { HashRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { WorkbenchProvider } from "./components/WorkbenchContext";
import { ProgressProvider } from "./components/ProgressContext";
import { Dashboard } from "./pages/Dashboard";
import { SkillsMatrix } from "./pages/SkillsMatrix";
import { Pathways } from "./pages/Pathways";
import { PidLab } from "./pages/PidLab";
import { ElectricalLab } from "./pages/ElectricalLab";
import { EmbeddedLab } from "./pages/EmbeddedLab";
import { PlcLab } from "./pages/PlcLab";
import { RoboticsLab } from "./pages/RoboticsLab";
import { MlLab } from "./pages/MlLab";
import { MechanicalLab } from "./pages/MechanicalLab";
import { PracticeLab } from "./pages/PracticeLab";
import { WorkbenchPage } from "./pages/WorkbenchPage";
import { DiagnosticsPage } from "./pages/DiagnosticsPage";
import { Labs } from "./pages/Labs";
import { NotFoundPage } from "./pages/NotFoundPage";

// HashRouter keeps deep links working on GitHub Pages without a 404 workaround.
export default function App() {
  return (
    <AppErrorBoundary>
      <ProgressProvider>
        <WorkbenchProvider>
          <HashRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/labs" element={<Labs />} />
                <Route path="/skills" element={<SkillsMatrix />} />
                <Route path="/pathways" element={<Pathways />} />
                <Route path="/labs/pid" element={<PidLab />} />
                <Route path="/labs/electrical" element={<ElectricalLab />} />
                <Route path="/labs/embedded" element={<EmbeddedLab />} />
                <Route path="/labs/plc" element={<PlcLab />} />
                <Route path="/labs/robotics" element={<RoboticsLab />} />
                <Route path="/labs/ml" element={<MlLab />} />
                <Route path="/labs/mechanical" element={<MechanicalLab />} />
                <Route path="/labs/practice" element={<PracticeLab />} />
                <Route path="/workbench" element={<WorkbenchPage />} />
                <Route path="/diagnostics" element={<DiagnosticsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </HashRouter>
        </WorkbenchProvider>
      </ProgressProvider>
    </AppErrorBoundary>
  );
}
