import React, { ReactElement } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';


// Import pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import DocumentsPage from './pages/DocumentsPage';
import LegalResearchPage from './pages/LegalResearchPage';
import NotFoundPage from './pages/NotFoundPage';
import SettingsPage from './pages/SettingsPage';



// Landing page component
const LandingPage = (): ReactElement => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <h1 className="text-3xl font-bold text-blue-700 mb-4">Private Lawyer Bot</h1>
        <p className="text-lg text-gray-700 mb-4">
          Your personal AI legal assistant, ready to help with legal documents, questions, and research.
        </p>        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-blue-700 mb-4">
          <h2 className="font-semibold mb-2">System Status</h2>
          <div className="flex items-center">
            <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
            <span>Backend API is running</span>
          </div>
          <div className="flex items-center mt-2">
            <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
            <span>Frontend is running</span>
          </div>
        </div>
        
        <div className="flex flex-col space-y-3 mt-6">
          <a 
            href="/chat" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-center transition-colors"
          >
            Open Chat
          </a>
          <a 
            href="/dashboard" 
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md text-center transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
        
        <p className="text-gray-600 text-sm mt-6">
          This is a simplified starter app for the Private Lawyer Bot project.
          Complete implementation requires proper setup of Supabase and OpenAI API.
        </p>
      </div>
    </div>  );
};

const App = (): ReactElement => {
  // For simplicity, we'll skip authentication for now 
  // and provide direct access to the chat feature
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Chat page - no authentication for testing */}
        <Route path="/chat" element={<ChatPage />} />
        
        {/* Other protected routes - would normally be protected */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/legal-research" element={<LegalResearchPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* Fallback routes */}
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
