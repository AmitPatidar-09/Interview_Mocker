import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard, MessageSquare, Code2, History,
  LogOut, Brain, ChevronRight, Zap
} from 'lucide-react'

const nav = [
  { label: 'Dashboard',  icon: LayoutDashboard, to: '/dashboard' },
  { label: 'New Interview', icon: MessageSquare, to: '/interview/setup' },
  { label: 'History',    icon: History,          to: '/history' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()

  return (
    <aside className="sidebar">
      {/* Logo */}
      <Link to="/dashboard" style={{ textDecoration: 'none', marginBottom: '8px' }}>
        <div className="navbar-logo" style={{ padding: '0 4px 16px', borderBottom: '1px solid var(--border)' }}>
          <div className="logo-icon">
            <Brain size={16} color="#fff" />
          </div>
          <span style={{ fontSize: '0.95rem' }}>InterviewAce</span>
          <span className="badge badge-brand" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>AI</span>
        </div>
      </Link>

      {/* Nav */}
      <div className="sidebar-label">Menu</div>
      {nav.map(({ label, icon: Icon, to }) => (
        <Link key={to} to={to}
          className={`sidebar-item ${
            pathname === to || (pathname.startsWith(to + '/') && to !== '/dashboard') ? 'active' : ''
          }`}
          style={{ textDecoration: 'none' }}
        >
          <Icon size={18} />
          {label}
          {to === '/interview/setup' && (
            <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
          )}
        </Link>
      ))}

      {/* Start Interview CTA */}
      <div style={{ marginTop: '8px' }}>
        <Link to="/interview/setup" className="btn btn-primary w-full" style={{ borderRadius: '10px', justifyContent: 'center' }}>
          <Zap size={15} />
          Start Interview
        </Link>
      </div>

      {/* Bottom — User */}
      <div style={{ marginTop: 'auto' }}>
        <div className="sidebar-divider" />
        <div style={{ padding: '8px 4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
          }}>
            {user?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.full_name}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={logout} title="Logout" style={{ padding: '4px 6px', flexShrink: 0 }}>
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}
