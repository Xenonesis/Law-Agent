import api from './api';

export interface RegisterParams {
  email: string;
  password: string;
  fullName?: string;
}

export interface LoginParams {
  username: string;  // Using username to match API expectations
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: string;
  email: string;
  full_name?: string;
}

const authService = {
  // Register a new user
  register: async (params: RegisterParams): Promise<UserResponse> => {
    const response = await api.post<UserResponse>('/auth/register', {
      email: params.email,
      password: params.password,
      full_name: params.fullName
    });
    return response.data;
  },

  // Login with email and password
  login: async (params: LoginParams): Promise<AuthResponse> => {
    // Convert to form data as required by OAuth2
    const formData = new FormData();
    formData.append('username', params.username);
    formData.append('password', params.password);
    
    const response = await api.post<AuthResponse>('/auth/token', formData);
    
    // Store token in local storage
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    
    return response.data;
  },

  // Logout user
  logout: (): void => {
    localStorage.removeItem('token');
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },
};

export default authService;
