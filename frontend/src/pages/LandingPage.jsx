import { Link, useNavigate } from 'react-router-dom'
import { Brain, ArrowRight, Zap, Target, BarChart3, Code2, MessageSquare, Shield, ChevronRight } from 'lucide-react'

const features = [
  {
    icon: <MessageSquare size={22} />,
    title: 'AI Mock Interviews',
    desc: 'Get grilled by Gemini AI across DSA, DBMS, OS, Computer Networks & OOPs with dynamic follow-ups.',
  },
  {
    icon: <Code2 size={22} />,
    title: 'Live Coding Arena',
    desc: 'Write, run, and submit code in a VS Code-style editor. Instant execution via Judge0 with AI code review.',
  },
  {
    icon: <BarChart3 size={22} />,
    title: 'Smart Analytics',
    desc: 'Track scores, spot weak areas, and visualize your progress across topics over time.',
  },
  {
    icon: <Target size={22} />,
    title: 'Company Mode',
    desc: 'Practice with questions tailored to Amazon, Microsoft, Atlassian & Adobe interview styles.',
  },
  {
    icon: <Zap size={22} />,
    title: 'Instant Feedback',
    desc: 'Get scored answers, ideal responses, and actionable weaknesses after every question.',
  },
  {
    icon: <Shield size={22} />,
    title: 'Difficulty Levels',
    desc: 'Ease into Easy, grind through Medium, or prove yourself at Hard — you set the pace.',
  },
]

const topics = [
  { label: 'Data Structures & Algorithms', color: '#6366f1', emoji: '🧮' },
  { label: 'Database Management',          color: '#10b981', emoji: '🗄️' },
  { label: 'Operating Systems',            color: '#f97316', emoji: '💻' },
  { label: 'Computer Networks',            color: '#3b82f6', emoji: '🌐' },
  { label: 'Object-Oriented Programming',  color: '#a855f7', emoji: '🔷' },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div>
      {/* ── Navbar ───────────────────────────── */}
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="navbar-logo">
            <div className="logo-icon"><Brain size={16} color="#fff" /></div>
            <span>InterviewAce AI</span>
          </div>
          <div className="navbar-links">
            <Link to="/login"    className="navbar-link">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="pulse-dot" />
            Powered by Gemini 2.5 Flash
          </div>
          <h1>
            Crack Every Tech Interview with{' '}
            <span className="gradient-text">AI-Powered</span> Practice
          </h1>
          <p>
            Simulate real interviews, get instant AI feedback, solve DSA problems live —
            all in one premium platform built for serious candidates.
          </p>
          <div className="hero-actions">
            <button
              className="btn btn-gradient btn-lg"
              onClick={() => navigate('/register')}
            >
              <span>
                Start Practicing Free
                <ArrowRight size={18} />
              </span>
            </button>
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => navigate('/login')}
            >
              Sign In
            </button>
          </div>

          {/* Topic pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 40 }}>
            {topics.map((t) => (
              <span key={t.label} style={{
                padding: '5px 14px',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 600,
                background: `${t.color}18`,
                color: t.color,
                border: `1px solid ${t.color}30`,
              }}>
                {t.emoji} {t.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────── */}
      <section className="section" style={{ background: 'var(--bg-surface)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="badge badge-brand" style={{ marginBottom: 12 }}>Features</div>
            <h2>Everything you need to <span className="gradient-text">land the job</span></h2>
            <p style={{ marginTop: 12, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
              From mock interviews to live coding — one platform covers your full interview prep journey.
            </p>
          </div>
          <div className="features-grid">
            {features.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p style={{ fontSize: '0.875rem', marginTop: 6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────── */}
      <section className="section">
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(16,185,129,0.08))',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 24, padding: '60px 40px',
          }}>
            <h2>Ready to ace your next interview?</h2>
            <p style={{ marginTop: 12, marginBottom: 32 }}>
              Join thousands of developers who practice smarter with AI.
            </p>
            <button
              className="btn btn-gradient btn-lg"
              onClick={() => navigate('/register')}
            >
              <span>
                Create Free Account
                <ChevronRight size={18} />
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────── */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '24px',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.85rem',
      }}>
        © 2025 InterviewAce AI — Built with ❤️ &amp; Gemini
      </footer>
    </div>
  )
}
