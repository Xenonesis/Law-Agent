import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-700">404</h1>
        <h2 className="text-3xl font-semibold text-neutral-900 mt-4">Page Not Found</h2>
        <p className="text-neutral-600 mt-2">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/">
          <Button className="mt-6">Return to Home</Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
