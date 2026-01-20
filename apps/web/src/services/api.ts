import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState()
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      const { refreshToken, logout, setAuth } = useAuthStore.getState()
      
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          })
          
          const { user, access_token, refresh_token } = response.data
          setAuth(user, access_token, refresh_token)
          
          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return api(originalRequest)
        } catch {
          logout()
        }
      } else {
        logout()
      }
    }
    
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: async (data: { email: string; password: string; name: string }) => {
    const response = await api.post('/auth/register', data)
    return response.data
  },
  
  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data)
    return response.data
  },
  
  refresh: async (refreshToken: string) => {
    const response = await api.post('/auth/refresh', { refresh_token: refreshToken })
    return response.data
  },
}

// User API
export const userAPI = {
  getProfile: async () => {
    const response = await api.get('/me')
    return response.data
  },
  
  updateProfile: async (data: { name?: string; avatar_url?: string }) => {
    const response = await api.put('/me', data)
    return response.data
  },
}

// Streak API
export const streakAPI = {
  getStreak: async () => {
    const response = await api.get('/streak')
    return response.data
  },
  
  completeDay: async () => {
    const response = await api.post('/streak/complete')
    return response.data
  },
  
  getHistory: async () => {
    const response = await api.get('/streak/history')
    return response.data
  },
}

// Questions API
export const questionsAPI = {
  getTodayQuestions: async () => {
    const response = await api.get('/questions/today')
    return response.data
  },
  
  getQuestion: async (id: number) => {
    const response = await api.get(`/questions/${id}`)
    return response.data
  },
}

// Sessions API
export const sessionsAPI = {
  startSession: async (questionId: number) => {
    const response = await api.post('/sessions/start', { question_id: questionId })
    return response.data
  },
  
  completeSession: async (sessionId: number, timeSpentSeconds: number) => {
    const response = await api.post(`/sessions/${sessionId}/complete`, {
      time_spent_seconds: timeSpentSeconds,
    })
    return response.data
  },
  
  getHistory: async () => {
    const response = await api.get('/sessions/history')
    return response.data
  },
}

// Progress API
export const progressAPI = {
  getStats: async () => {
    const response = await api.get('/progress/stats')
    return response.data
  },
  
  getCalendar: async () => {
    const response = await api.get('/progress/calendar')
    return response.data
  },
}

export default api
