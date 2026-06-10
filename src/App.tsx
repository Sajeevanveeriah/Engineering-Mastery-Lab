import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
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

// HashRouter keeps deep links working on GitHub Pages without a 404 workaround.
export default function App() {
  return (
    <ProgressProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </ProgressProvider>
  );
}
