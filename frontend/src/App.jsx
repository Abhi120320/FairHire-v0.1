import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Upload from './pages/Upload';
import Dashboard from './pages/Dashboard';
import Report from './pages/Report';
import DriftMonitor from './pages/DriftMonitor';
import AuditTrail from './pages/AuditTrail';
import ProxyDetector from './pages/ProxyDetector';
import CandidatePortal from './pages/CandidatePortal';
import LDASuggester from './pages/LDASuggester';
import IntersectionalMatrix from './pages/IntersectionalMatrix';
import JDAnalyzer from './pages/JDAnalyzer';
import CandidatesPage from './pages/CandidatesPage';
import ReportsPage from './pages/ReportsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/report/:candidateId" element={<Report />} />
        <Route path="/drift" element={<DriftMonitor />} />
        <Route path="/audit" element={<AuditTrail />} />
        <Route path="/proxy" element={<ProxyDetector />} />
        <Route path="/candidate" element={<CandidatePortal />} />
        <Route path="/lda" element={<LDASuggester />} />
        <Route path="/intersectional" element={<IntersectionalMatrix />} />
        <Route path="/jd-analyzer" element={<JDAnalyzer />} />
        <Route path="/candidates" element={<CandidatesPage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
