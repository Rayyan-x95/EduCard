import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const GeneratorPage = lazy(() => import('./pages/GeneratorPage').then(m => ({ default: m.GeneratorPage })));
const ArchitecturePage = lazy(() => import('./pages/ArchitecturePage').then(m => ({ default: m.ArchitecturePage })));
const APIReferencePage = lazy(() => import('./pages/APIReferencePage').then(m => ({ default: m.APIReferencePage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));

// Loading Fallback
const PageLoader = () => (
  <div className="min-h-screen bg-dark flex items-center justify-center">
    <div className="flex items-center gap-3">
      <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
      <span className="font-mono text-xs text-primary uppercase tracking-widest">Loading Module...</span>
    </div>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/generate" element={<GeneratorPage />} />
          <Route path="/architecture" element={<ArchitecturePage />} />
          <Route path="/api-reference" element={<APIReferencePage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
