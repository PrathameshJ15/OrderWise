import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ui/ErrorBoundary';
import PlaceholderLayout from './components/layout/PlaceholderLayout';
import Home from './pages/Home';
import AIRecommendations from './pages/admin/AIRecommendations';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<PlaceholderLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/admin/ai" element={<AIRecommendations />} />
            <Route path="/ai" element={<Navigate to="/admin/ai" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
