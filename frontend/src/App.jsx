import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'

import LandingPage    from './pages/LandingPage'
import LoginPage      from './pages/LoginPage'
import RegisterPage   from './pages/RegisterPage'
import DashboardPage  from './pages/DashboardPage'
import InterviewSetup from './pages/InterviewSetup'
import InterviewSession from './pages/InterviewSession'
import CodingArena    from './pages/CodingArena'
import HistoryPage    from './pages/HistoryPage'
import InterviewDetail from './pages/InterviewDetail'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="loading-overlay" style={{ height: '100vh' }}>
      <div className="spinner spinner-lg" />
      <span>Loading...</span>
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#18181b',
              color: '#f4f4f5',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              fontSize: '0.9rem',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#18181b' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#18181b' } },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          {/* Protected */}
          <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/interview/setup"  element={<PrivateRoute><InterviewSetup /></PrivateRoute>} />
          <Route path="/interview/:id"    element={<PrivateRoute><InterviewSession /></PrivateRoute>} />
          <Route path="/interview/:id/coding" element={<PrivateRoute><CodingArena /></PrivateRoute>} />
          <Route path="/history"          element={<PrivateRoute><HistoryPage /></PrivateRoute>} />
          <Route path="/history/:id"      element={<PrivateRoute><InterviewDetail /></PrivateRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
