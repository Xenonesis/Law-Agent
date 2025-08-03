import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  FileText, 
  Search, 
  Settings, 
  TrendingUp, 
  Clock, 
  Shield, 
  Sparkles,
  BarChart3,
  Users,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalConversations: number;
  documentsAnalyzed: number;
  questionsAnswered: number;
  systemUptime: string;
  providerUsage: Record<string, number>;
  recentActivity: {
    chats: number;
    documents: number;
    queries: number;
  };
  systemStatus: {
    apiOnline: boolean;
    aiModelsReady: boolean;
    databaseConnected: boolean;
  };
  availableProviders: string[];
  lastUpdated: string;
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalConversations: 0,
    documentsAnalyzed: 0,
    questionsAnswered: 0,
    systemUptime: '99.9%',
    providerUsage: {},
    recentActivity: { chats: 0, documents: 0, queries: 0 },
    systemStatus: { apiOnline: false, aiModelsReady: false, databaseConnected: false },
    availableProviders: [],
    lastUpdated: ''
  });
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await apiService.getDashboardStats();
      setStats(data);
      setLastRefresh(new Date());
      toast.success('Dashboard data updated');
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      title: 'AI Legal Chat',
      description: 'Get instant answers to your legal questions through our advanced AI assistant.',
      icon: MessageSquare,
      link: '/chat',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      stats: `${stats.questionsAnswered} questions answered`
    },
    {
      title: 'Document Analysis',
      description: 'Upload and analyze legal documents to extract key information and insights.',
      icon: FileText,
      link: '/documents',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      stats: `${stats.documentsAnalyzed} documents processed`
    },
    {
      title: 'Legal Research',
      description: 'Search for relevant case law and legal precedents for your specific situation.',
      icon: Search,
      link: '/chat',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      stats: 'Comprehensive database access'
    },
    {
      title: 'System Settings',
      description: 'Configure API keys, preferences, and customize your legal assistant experience.',
      icon: Settings,
      link: '/settings',
      color: 'from-gray-500 to-gray-600',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-600',
      stats: 'Personalized configuration'
    }
  ];

  const quickActions = [
    { title: 'Contract Review', description: 'Analyze contract terms and conditions' },
    { title: 'Legal Compliance', description: 'Check regulatory compliance requirements' },
    { title: 'Case Research', description: 'Find relevant legal precedents' },
    { title: 'Document Drafting', description: 'Get help with legal document templates' }
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-primary-600 to-accent-600 rounded-xl shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold gradient-text">Welcome to Private Lawyer Bot</h1>
              <p className="text-neutral-600 text-lg mt-2">Your AI-powered legal assistant, available 24/7</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview with Refresh Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-neutral-800">Dashboard Overview</h2>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-neutral-500">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
              <button
                onClick={fetchDashboardStats}
                disabled={loading}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card-interactive">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-800">
                    {loading ? '...' : stats.totalConversations}
                  </p>
                  <p className="text-sm text-neutral-600">Total Conversations</p>
                </div>
              </div>
            </div>

            <div className="card-interactive">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-800">
                    {loading ? '...' : stats.documentsAnalyzed}
                  </p>
                  <p className="text-sm text-neutral-600">Documents Analyzed</p>
                </div>
              </div>
            </div>

            <div className="card-interactive">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-800">
                    {loading ? '...' : stats.questionsAnswered}
                  </p>
                  <p className="text-sm text-neutral-600">Questions Answered</p>
                </div>
              </div>
            </div>

            <div className="card-interactive">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-800">
                    {loading ? '...' : stats.systemUptime}
                  </p>
                  <p className="text-sm text-neutral-600">System Uptime</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Feature Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="card-interactive group"
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 ${feature.bgColor} rounded-xl group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className={`w-8 h-8 ${feature.textColor}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-neutral-800 mb-2">{feature.title}</h3>
                    <p className="text-neutral-600 mb-3 leading-relaxed">{feature.description}</p>
                    <p className="text-sm text-neutral-500 mb-4">{feature.stats}</p>
                    <Link to={feature.link}>
                      <button className={`btn btn-primary bg-gradient-to-r ${feature.color} hover:shadow-lg`}>
                        Get Started
                      </button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-accent-100 rounded-lg">
              <Clock className="w-6 h-6 text-accent-600" />
            </div>
            <h2 className="text-2xl font-semibold text-neutral-800">Quick Actions</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link key={action.title} to="/chat" className="group">
                <div className="p-4 border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50/50 transition-all duration-200 group-hover:shadow-md">
                  <h4 className="font-medium text-neutral-800 group-hover:text-primary-700 mb-1">
                    {action.title}
                  </h4>
                  <p className="text-sm text-neutral-600">{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${stats.systemStatus.apiOnline && stats.systemStatus.aiModelsReady && stats.systemStatus.databaseConnected ? 'bg-green-100' : 'bg-yellow-100'}`}>
                <CheckCircle className={`w-6 h-6 ${stats.systemStatus.apiOnline && stats.systemStatus.aiModelsReady && stats.systemStatus.databaseConnected ? 'text-green-600' : 'text-yellow-600'}`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-800">System Status</h3>
                <p className="text-sm text-neutral-600">
                  {stats.systemStatus.apiOnline && stats.systemStatus.aiModelsReady && stats.systemStatus.databaseConnected 
                    ? 'All systems operational' 
                    : 'Some services may be limited'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${stats.systemStatus.apiOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className={stats.systemStatus.apiOnline ? 'text-green-700' : 'text-red-700'}>
                  API {stats.systemStatus.apiOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${stats.systemStatus.aiModelsReady ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className={stats.systemStatus.aiModelsReady ? 'text-green-700' : 'text-red-700'}>
                  AI Models {stats.systemStatus.aiModelsReady ? 'Ready' : 'Not Ready'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${stats.systemStatus.databaseConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className={stats.systemStatus.databaseConnected ? 'text-green-700' : 'text-red-700'}>
                  Database {stats.systemStatus.databaseConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Provider Usage Statistics */}
          {Object.keys(stats.providerUsage).length > 0 && (
            <div className="mt-4 pt-4 border-t border-neutral-200">
              <h4 className="text-sm font-medium text-neutral-700 mb-2">AI Provider Usage</h4>
              <div className="flex items-center space-x-4 text-sm">
                {Object.entries(stats.providerUsage).map(([provider, count]) => (
                  <div key={provider} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-neutral-600 capitalize">
                      {provider}: {count} requests
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Available Providers */}
          {stats.availableProviders.length > 0 && (
            <div className="mt-2 pt-2 border-t border-neutral-200">
              <h4 className="text-sm font-medium text-neutral-700 mb-2">Available AI Providers</h4>
              <div className="flex flex-wrap gap-2">
                {stats.availableProviders.map((provider) => (
                  <span 
                    key={provider} 
                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full capitalize"
                  >
                    {provider}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
        
        {/* Enhanced Disclaimer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 p-6 rounded-xl shadow-soft"
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 p-2 bg-amber-100 rounded-lg">
              <Shield className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-amber-800 mb-2">Important Legal Disclaimer</h3>
              <p className="text-amber-700 leading-relaxed">
                This tool provides legal information, not legal advice. The AI assistant is designed to help you 
                understand legal concepts and provide general guidance. For advice specific to your situation, 
                please consult with a qualified attorney. The information provided is not a substitute for 
                professional legal counsel and should not be relied upon for making legal decisions.
              </p>
              <div className="mt-4 flex items-center space-x-4 text-sm text-amber-600">
                <div className="flex items-center space-x-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Educational purposes only</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>Consult qualified attorneys</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default DashboardPage;

