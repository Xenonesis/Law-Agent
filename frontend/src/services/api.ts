import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

// Types
interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

// Extend Axios config to include metadata
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: {
    startTime?: Date;
    [key: string]: any;
  };
}

interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryCondition?: (error: AxiosError) => boolean;
}

// Configuration
const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:9002',
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
};

// Create enhanced axios instance
const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_CONFIG.baseURL,
    timeout: API_CONFIG.timeout,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor
  instance.interceptors.request.use(
    (config: ExtendedAxiosRequestConfig) => {
      // Add auth token if available
      const token = localStorage.getItem('token') || 'test-token-123';
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add request timestamp for performance monitoring
      config.metadata = { startTime: new Date() };

      // Log request in development
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      }

      return config;
    },
    (error) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('Request interceptor error:', error);
      }
      return Promise.reject(error);
    }
  );

  // Response interceptor
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      // Calculate response time
      const endTime = new Date();
      const config = response.config as ExtendedAxiosRequestConfig;
      const startTime = config.metadata?.startTime;
      if (startTime) {
        const duration = endTime.getTime() - startTime.getTime();
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log(`✅ API Response: ${response.config.url} (${duration}ms)`);
        }
      }

      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

      // Handle different error types
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data as any;

        switch (status) {
          case 401:
            // Unauthorized - clear token and redirect
            localStorage.removeItem('token');
            toast.error('Session expired. Please log in again.');
            window.location.href = '/login';
            break;

          case 403:
            toast.error('Access denied. You don\'t have permission for this action.');
            break;

          case 404:
            toast.error('Resource not found.');
            break;

          case 429:
            // Rate limited - implement retry with exponential backoff
            if (!originalRequest._retry) {
              originalRequest._retry = true;
              const retryAfter = error.response.headers['retry-after'] || 5;
              await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
              return instance(originalRequest);
            }
            toast.error('Too many requests. Please try again later.');
            break;

          case 500:
            toast.error('Server error. Please try again later.');
            break;

          default:
            toast.error(data?.message || 'An unexpected error occurred.');
        }
      } else if (error.request) {
        // Network error - implement retry logic
        if (!originalRequest._retry && shouldRetry(error)) {
          originalRequest._retry = true;
          await delay(API_CONFIG.retryDelay);
          return instance(originalRequest);
        }
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error('Request failed. Please try again.');
      }

      return Promise.reject(createApiError(error));
    }
  );

  return instance;
};

// Utility functions
const shouldRetry = (error: AxiosError): boolean => {
  return (
    !error.response ||
    error.response.status >= 500 ||
    error.code === 'NETWORK_ERROR' ||
    error.code === 'TIMEOUT'
  );
};

const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const createApiError = (error: AxiosError): ApiError => {
  const response = error.response;
  const data = response?.data as any;

  return {
    message: data?.message || error.message || 'An error occurred',
    status: response?.status || 0,
    code: data?.code || error.code,
    details: data?.details || null,
  };
};

// Create the main API instance
const api = createApiInstance();

// Enhanced API methods
export const apiService = {
  // Generic methods
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    api.get(url, config).then(response => response.data),

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    api.post(url, data, config).then(response => response.data),

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    api.put(url, data, config).then(response => response.data),

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    api.delete(url, config).then(response => response.data),

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    api.patch(url, data, config).then(response => response.data),

  // Health check
  healthCheck: () => apiService.get('/api/health'),

  // Dashboard stats
  getDashboardStats: () => apiService.get('/api/dashboard/stats'),

  // Chat methods
  sendMessage: (content: string, provider?: string, apiKeys?: Record<string, string>) =>
    apiService.post('/api/chat/send', {
      content,
      provider,
      api_keys: apiKeys,
    }),

  getChatHistory: (userId?: string) =>
    apiService.get(`/api/chat/history${userId ? `?user_id=${userId}` : ''}`),

  // Document methods
  uploadDocument: (document: { title: string; description?: string; content?: string }) =>
    apiService.post('/api/documents/upload', document),

  listDocuments: () => apiService.get('/api/documents/list'),

  getDocument: (documentId: string) => apiService.get(`/api/documents/${documentId}`),

  analyzeDocument: (documentId: string) =>
    apiService.post(`/api/documents/${documentId}/analyze`),

  // Utility methods
  checkConnection: async (): Promise<boolean> => {
    try {
      await apiService.healthCheck();
      return true;
    } catch {
      return false;
    }
  },

  // File upload with progress
  uploadFile: (
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    }).then(response => response.data);
  },
};

// Connection monitor
export class ConnectionMonitor {
  private static instance: ConnectionMonitor;
  private isOnline = navigator.onLine;
  private listeners: Array<(online: boolean) => void> = [];

  private constructor() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  static getInstance(): ConnectionMonitor {
    if (!ConnectionMonitor.instance) {
      ConnectionMonitor.instance = new ConnectionMonitor();
    }
    return ConnectionMonitor.instance;
  }

  private handleOnline = () => {
    this.isOnline = true;
    this.notifyListeners();
    toast.success('Connection restored');
  };

  private handleOffline = () => {
    this.isOnline = false;
    this.notifyListeners();
    toast.error('Connection lost');
  };

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isOnline));
  }

  public subscribe(listener: (online: boolean) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public get online(): boolean {
    return this.isOnline;
  }
}

// Export default api instance for backward compatibility
export default api;

// Export types
export type { ApiError, RetryConfig };
