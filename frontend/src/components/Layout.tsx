import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  MessageSquare, 
  FileText, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Scale,
  Shield
} from 'lucide-react';


interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Navigation items with icons
  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Chat', path: '/chat', icon: MessageSquare },
    { name: 'Documents', path: '/documents', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    // Since we're not using authentication, just navigate to home
    navigate('/');
  };

  // Check if the current path matches a navigation item
  const isActive = (path: string) => {
    return path === '/' 
      ? location.pathname === path 
      : location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex flex-col">
      {/* Enhanced Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-md border-b border-neutral-200/50 shadow-soft sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Enhanced Logo */}
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="flex items-center space-x-3 group">
                  <div className="p-2 bg-gradient-to-r from-primary-600 to-accent-600 rounded-lg shadow-lg group-hover:shadow-glow transition-all duration-300">
                    <Scale className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="gradient-text font-bold text-xl tracking-tight">
                      Private Lawyer Bot
                    </span>
                    <div className="flex items-center space-x-1 text-xs text-neutral-500">
                      <Shield className="w-3 h-3" />
                      <span>Legal AI Assistant</span>
                    </div>
                  </div>
                </Link>
              </div>
              
              {/* Enhanced Desktop Navigation */}
              <nav className="hidden sm:ml-8 sm:flex sm:space-x-2 items-center">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`
                        flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover-lift
                        ${isActive(item.path)
                          ? 'bg-gradient-to-r from-primary-100 to-accent-100 text-primary-800 shadow-soft'
                          : 'text-neutral-600 hover:bg-white/80 hover:text-neutral-800 hover:shadow-soft'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
            
            {/* Enhanced User Actions */}
            <div className="flex items-center space-x-3">
              {/* Status Indicator */}
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-700 font-medium">Online</span>
              </div>

              {/* Enhanced Logout Button */}
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 hover-lift"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
              
              {/* Enhanced Mobile Menu Button */}
              <div className="sm:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 rounded-lg text-neutral-500 hover:text-neutral-800 hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200"
                >
                  <span className="sr-only">Toggle menu</span>
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="sm:hidden border-t border-neutral-200/50 bg-white/95 backdrop-blur-md"
            >
              <div className="px-4 py-3 space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`
                        flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200
                        ${isActive(item.path)
                          ? 'bg-gradient-to-r from-primary-100 to-accent-100 text-primary-800'
                          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800'
                        }
                      `}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
                
                <div className="pt-2 border-t border-neutral-200">
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
      
      {/* Main content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
      
      {/* Enhanced Footer */}
      <motion.footer 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-md border-t border-neutral-200/50 shadow-soft"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-gradient-to-r from-primary-600 to-accent-600 rounded-md">
                <Scale className="w-4 h-4 text-white" />
              </div>
              <span className="gradient-text font-semibold">Private Lawyer Bot</span>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-neutral-600 mb-2">
                &copy; {new Date().getFullYear()} Private Lawyer Bot. All rights reserved.
              </p>
              <div className="flex items-center justify-center space-x-2 p-3 bg-amber-50/80 rounded-lg border border-amber-200/50">
                <Shield className="w-4 h-4 text-amber-600" />
                <p className="text-xs text-amber-800">
                  <span className="font-medium">Legal Disclaimer:</span> This application provides legal information, not legal advice.
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-xs text-neutral-500">
              <span>Powered by AI</span>
              <span>•</span>
              <span>Secure & Private</span>
              <span>•</span>
              <span>24/7 Available</span>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
};

export default Layout;
