import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({ baseURL: API_BASE })

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Global 401 handler — auto logout
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  me:       ()     => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
}

// ── Interviews ────────────────────────────────────────────────
export const interviewAPI = {
  list:     ()            => api.get('/interviews'),
  start:    (data)        => api.post('/interviews/start', data),
  session:  (id)          => api.get(`/interviews/${id}/session`),
  evaluate: (data)        => api.post('/interviews/evaluate', data),
  complete: (interviewId) => api.post('/interviews/complete', { interview_id: interviewId }),
  detail:   (id)          => api.get(`/interviews/${id}`),
  delete:   (id)          => api.delete(`/interviews/${id}`),
}

// ── Coding ────────────────────────────────────────────────────
export const codingAPI = {
  getProblem: (difficulty, company_mode) =>
    api.get('/coding/problem', { params: { difficulty, company_mode } }),
  runCode:    (data) => api.post('/coding/run', data),
  submitCode: (data) => api.post('/coding/submit', data),
}

// ── Analytics ─────────────────────────────────────────────────
export const analyticsAPI = {
  dashboard: ()               => api.get('/analytics/dashboard'),
  history:   (page, per_page) => api.get('/analytics/history', { params: { page, per_page } }),
}

export default api
