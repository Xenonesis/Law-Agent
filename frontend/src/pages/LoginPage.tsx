import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Login Page
          </h2>
          <p className="mt-4 text-gray-600">
            Authentication is currently disabled for this demo.
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-blue-800 text-sm">
              This is a placeholder login page. Authentication features are not implemented in this demo version.
            </p>
          </div>

          <div className="flex flex-col space-y-3">
            <Link to="/chat">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Go to Chat (No Login Required)
              </Button>
            </Link>
            
            <Link to="/dashboard">
              <Button className="w-full bg-gray-600 hover:bg-gray-700 text-white">
                Go to Dashboard
              </Button>
            </Link>
            
            <Link to="/">
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                Back to Home
              </Button>
            </Link>
          </div>

          <div className="text-center">
            <Link to="/register" className="text-indigo-600 hover:text-indigo-500">
              Go to Register Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;