
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  EyeOff, 
  Save, 
  Trash2, 
  AlertCircle, 
  Settings, 
  Shield, 
  Key,
  Lock,
  Server,
  Sparkles
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Layout from '../components/Layout';
import Button from '../components/Button';
import { ApiKeyService, ApiKeys, API_KEY_CONFIGS } from '../services/apiKeyService';

const SettingsPage: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKeys>(ApiKeyService.getApiKeys());
  const [showKeys, setShowKeys] = useState<Record<keyof ApiKeys, boolean>>({
    gemini: false,
    mistral: false,
    claude: false,
    openai: false,
    openrouter: false,
    lmstudio: false,
    ollama: false,
  });
  const [validationErrors, setValidationErrors] = useState<Record<keyof ApiKeys, string>>({
    gemini: '',
    mistral: '',
    claude: '',
    openai: '',
    openrouter: '',
    lmstudio: '',
    ollama: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load API keys on component mount
    setApiKeys(ApiKeyService.getApiKeys());
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const key = name as keyof ApiKeys;
    
    setApiKeys(prevKeys => ({
      ...prevKeys,
      [key]: value,
    }));

    // Clear validation error when user starts typing
    if (validationErrors[key]) {
      setValidationErrors(prev => ({
        ...prev,
        [key]: '',
      }));
    }


  };

  const toggleShowKey = (key: keyof ApiKeys) => {
    setShowKeys(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const validateKeys = (): boolean => {
    const errors: Record<keyof ApiKeys, string> = {
      gemini: '',
      mistral: '',
      claude: '',
      openai: '',
      openrouter: '',
      lmstudio: '',
      ollama: '',
    };

    let hasErrors = false;

    API_KEY_CONFIGS.forEach(config => {
      const value = apiKeys[config.key];
      
      if (config.required && !value.trim()) {
        errors[config.key] = `${config.label} is required`;
        hasErrors = true;
      } else if (value.trim() && !ApiKeyService.validateApiKey(config.key, value)) {
        errors[config.key] = `Invalid ${config.label} format`;
        hasErrors = true;
      }
    });

    setValidationErrors(errors);
    return !hasErrors;
  };

  const handleSave = async () => {
    if (!validateKeys()) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    setIsSaving(true);

    try {
      const success = ApiKeyService.saveApiKeys(apiKeys);
      if (success) {
        toast.success('API keys saved successfully!');
      } else {
        toast.error('Failed to save API keys');
      }
    } catch (error) {
      toast.error('An error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all API keys? This action cannot be undone.')) {
      const emptyKeys: ApiKeys = {
        gemini: '',
        mistral: '',
        claude: '',
        openai: '',
        openrouter: '',
        lmstudio: '',
        ollama: '',
      };
      setApiKeys(emptyKeys);
      ApiKeyService.clearApiKeys();
      toast.success('All API keys cleared');
    }
  };

  const getProviderIcon = (key: string) => {
    switch (key) {
      case 'openai':
        return <Sparkles className="w-5 h-5 text-green-600" />;
      case 'gemini':
        return <Server className="w-5 h-5 text-blue-600" />;
      case 'mistral':
        return <Server className="w-5 h-5 text-purple-600" />;
      case 'claude':
        return <Server className="w-5 h-5 text-orange-600" />;
      default:
        return <Key className="w-5 h-5 text-neutral-600" />;
    }
  };

  return (
    <Layout>
      <Toaster />
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-primary-600 to-accent-600 rounded-xl shadow-lg">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold gradient-text">API Key Settings</h1>
              <p className="text-neutral-600 text-lg mt-2">Configure your AI provider credentials</p>
            </div>
          </div>
        </motion.div>

        {/* Enhanced API Keys Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Key className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold text-neutral-800">Provider Configuration</h2>
          </div>

          <div className="space-y-6">
            {API_KEY_CONFIGS.map((config, index) => (
              <motion.div
                key={config.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3">
                  {getProviderIcon(config.key)}
                  <label htmlFor={config.key} className="text-sm font-semibold text-neutral-700">
                    {config.label}
                    {config.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                </div>
                
                <div className="relative">
                  <input
                    type={showKeys[config.key] ? 'text' : 'password'}
                    name={config.key}
                    id={config.key}
                    value={apiKeys[config.key]}
                    onChange={handleChange}
                    placeholder={config.placeholder}
                    className={`input w-full pr-12 ${
                      validationErrors[config.key] ? 'input-error' : ''
                    }`}
                  />
                  
                  {apiKeys[config.key] && (
                    <button
                      type="button"
                      onClick={() => toggleShowKey(config.key)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-neutral-600 transition-colors duration-200"
                    >
                      {showKeys[config.key] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
                
                <AnimatePresence>
                  {validationErrors[config.key] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center space-x-2 text-sm text-red-600"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{validationErrors[config.key]}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <p className="text-sm text-neutral-500 leading-relaxed">{config.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Enhanced Actions */}
          <div className="mt-8 pt-6 border-t border-neutral-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
              <Button
                variant="danger"
                onClick={handleClearAll}
                icon={<Trash2 className="w-4 h-4" />}
                className="hover-lift"
              >
                Clear All Keys
              </Button>
              
              <Button
                onClick={handleSave}
                isLoading={isSaving}
                icon={<Save className="w-4 h-4" />}
                className="hover-lift"
              >
                {isSaving ? 'Saving...' : 'Save API Keys'}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Security Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 p-6 rounded-xl shadow-soft"
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 p-2 bg-amber-100 rounded-lg">
              <Shield className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-amber-800 mb-2">Security & Privacy</h3>
              <div className="space-y-2 text-amber-700">
                <p className="leading-relaxed">
                  Your API keys are stored locally in your browser's localStorage and are never transmitted to our servers. 
                  They are only used to make direct API calls to the respective AI providers.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span className="text-sm">Local storage only</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-amber-600" />
                    <span className="text-sm">End-to-end encryption</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Server className="w-4 h-4 text-amber-600" />
                    <span className="text-sm">Direct API calls</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Key className="w-4 h-4 text-amber-600" />
                    <span className="text-sm">No server storage</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
