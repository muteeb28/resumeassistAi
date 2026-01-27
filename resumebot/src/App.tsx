
import './App.css'
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom'
import { AnimatedPinDemo } from './components/AnimatedPinDemo'
import OptimizeResumePage from './components/optimize-resume-page'
import ATSOptimizePage from './components/ats-optimize-page'
import { CreateResumeSimple } from './components/create-resume-simple'
import { ResumeBuilder } from './components/resume-builder'
import { LiveResumeBuilder } from './components/live-resume-builder'
import ResumeTestPage from './components/ResumeTestPage'
import { useEffect } from 'react'
import { useUserStore } from './stores/useUserStore'
import JobTrackerPage from './components/job-tracker-page'
import LoginPage from './components/login-page'
import SignupPage from './components/signup-page'
import { Toaster } from 'react-hot-toast'
import { LoaderFive } from './components/ui/loader'

const ResumeBuilderWrapper = () => {
  const { templateId } = useParams<{ templateId: string }>();

  const templates = [
    { id: 'deedy', name: 'Deedy Resume', price: 0, isFree: true },
    { id: 'modern', name: 'Modern Professional', price: 0, isFree: true },
    { id: 'academic', name: 'Academic CV', price: 12, isFree: false },
    { id: 'creative', name: 'Creative Designer', price: 15, isFree: false },
    { id: 'minimal', name: 'Minimal Clean', price: 8, isFree: false },
    { id: 'corporate', name: 'Corporate Elite', price: 18, isFree: false },
    { id: 'tech', name: 'Tech Specialist', price: 10, isFree: false },
    { id: 'banking', name: 'Banking & Finance', price: 14, isFree: false },
    { id: 'engineering', name: 'Engineering Pro', price: 16, isFree: false },
    { id: 'medical', name: 'Medical Professional', price: 20, isFree: false },
    { id: 'consulting', name: 'McKinsey Style', price: 25, isFree: false },
    { id: 'startup', name: 'Startup Founder', price: 12, isFree: false },
    { id: 'legal', name: 'Legal Professional', price: 18, isFree: false },
    { id: 'sales', name: 'Sales Executive', price: 14, isFree: false },
    { id: 'marketing', name: 'Marketing Specialist', price: 16, isFree: false },
    { id: 'designer', name: 'UI/UX Designer', price: 22, isFree: false },
    { id: 'data', name: 'Data Scientist', price: 18, isFree: false },
    { id: 'manager', name: 'Project Manager', price: 15, isFree: false },
    { id: 'freelancer', name: 'Freelancer Portfolio', price: 13, isFree: false },
    { id: 'graduate', name: 'Fresh Graduate', price: 9, isFree: false },
    { id: 'executive', name: 'C-Suite Executive', price: 30, isFree: false }
  ];

  const selectedTemplate = templates.find(t => t.id === templateId);

  if (!selectedTemplate) {
    return <div>Template not found</div>;
  }

  return <ResumeBuilder selectedTemplate={selectedTemplate} />;
};

function App() {
  const { checkAuth, checkingAuth } = useUserStore();
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <LoaderFive text="Checking authentication..." />
      </div>
    );
  }
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<AnimatedPinDemo />} />
        <Route path="/optimize" element={<OptimizeResumePage />} />
        <Route path="/ats-optimize" element={<ATSOptimizePage />} />
        <Route path="/create" element={<CreateResumeSimple />} />
        <Route path="/job-tracker" element={<JobTrackerPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/build/:templateId" element={<ResumeBuilderWrapper />} />
        <Route path="/live-builder/:templateId" element={<LiveResumeBuilder />} />
        <Route path="/test-templates" element={<ResumeTestPage />} />
      </Routes>
    </Router>
  )
}

export default App

