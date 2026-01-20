import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { API_BASE_URL } from '../config/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Log API configuration on startup
console.log('🔧 API Configuration:', {
  baseURL: API_BASE_URL,
  platform: require('react-native').Platform.OS,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`, {
      baseURL: config.baseURL,
      hasAuth: !!accessToken,
    });
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log error details with more context
    if (error.response) {
      // Server responded with error status
      console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
        status: error.response.status,
        data: error.response.data,
        baseURL: error.config?.baseURL,
      });
    } else if (error.request) {
      // Request was made but no response received
      const fullUrl = error.config?.baseURL 
        ? `${error.config.baseURL}${error.config.url || ''}` 
        : error.config?.url;
      
      console.error(`❌ Network error - No response received:`, {
        url: fullUrl,
        message: error.message,
        code: error.code,
        baseURL: error.config?.baseURL,
        timeout: error.config?.timeout,
      });
      
      // Provide helpful error messages based on error code
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        console.error(
          '💡 Troubleshooting tips:\n' +
          `  1. Check if backend server is running\n` +
          `  2. Verify the API URL: ${error.config?.baseURL}\n` +
          `  3. For Android emulator, ensure backend is accessible at 10.0.2.2\n` +
          `  4. For physical device, use your computer's IP address\n` +
          `  5. Check firewall settings\n` +
          `  6. Try accessing ${fullUrl} in a browser or curl`
        );
      } else if (error.code === 'ETIMEDOUT') {
        console.error('💡 Request timed out. Check network connection or increase timeout.');
      }
    } else {
      // Error in request setup
      console.error('❌ Request setup error:', error.message);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const { refreshToken, logout, setAuth } = useAuthStore.getState();

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { user, access_token, refresh_token } = response.data;
          setAuth(user, access_token, refresh_token);

          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch {
          logout();
        }
      } else {
        logout();
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (data: { email: string; password: string; name: string }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
};

// Streak API
export const streakAPI = {
  getStreak: async () => {
    const response = await api.get('/streak');
    return response.data;
  },

  completeDay: async () => {
    const response = await api.post('/streak/complete');
    return response.data;
  },
};

// Questions API
export const questionsAPI = {
  getTodayQuestions: async () => {
    const response = await api.get('/questions/today');
    return response.data;
  },

  getQuestion: async (id: number) => {
    const response = await api.get(`/questions/${id}`);
    return response.data;
  },
};

// Sessions API
export const sessionsAPI = {
  startSession: async (questionId: number) => {
    const response = await api.post('/sessions/start', { question_id: questionId });
    return response.data;
  },

  completeSession: async (sessionId: number, timeSpentSeconds: number) => {
    const response = await api.post(`/sessions/${sessionId}/complete`, {
      time_spent_seconds: timeSpentSeconds,
    });
    return response.data;
  },
};

// Progress API
export const progressAPI = {
  getStats: async () => {
    const response = await api.get('/progress/stats');
    return response.data;
  },
};

// Helper function to test API connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const response = await api.get('/health');
    console.log('✅ API connection test successful:', response.data);
    return true;
  } catch (error: any) {
    console.error('❌ API connection test failed:', {
      message: error.message,
      code: error.code,
      baseURL: API_BASE_URL,
    });
    return false;
  }
};

export default api;
