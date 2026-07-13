import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Brain, Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]       = useState({ full_name: '', email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.full_name || !form.email || !form.password) return toast.error('Please fill all fields')
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters')
    if (!/[A-Z]/.test(form.password)) return toast.error('Password must contain an uppercase letter')
    if (!/[a-z]/.test(form.password)) return toast.error('Password must contain a lowercase letter')
    if (!/\d/.test(form.password)) return toast.error('Password must contain a digit')
    setLoading(true)
    try {
      await register(form.email, form.full_name, form.password)
      toast.success('Account created! Welcome 🎉')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-base)', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 60%)',
      }} />

      <div style={{ width: '100%', maxWidth: 420, padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 12px',
            background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Brain size={26} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 4 }}>Create your account</h2>
          <p style={{ fontSize: '0.9rem' }}>Start your interview prep journey today</p>
        </div>

        <form onSubmit={handleSubmit} style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 20, padding: 32, display: 'flex', flexDirection: 'column', gap: 18,
        }}>
          {[
            { key: 'full_name', label: 'Full Name', type: 'text', placeholder: 'Alex Johnson', Icon: User },
            { key: 'email',     label: 'Email',     type: 'email', placeholder: 'you@example.com', Icon: Mail },
          ].map(({ key, label, type, placeholder, Icon }) => (
            <div key={key} className="form-group">
              <label className="form-label">{label}</label>
              <div style={{ position: 'relative' }}>
                <Icon size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={type}
                  className="form-input"
                  placeholder={placeholder}
                  style={{ paddingLeft: 40 }}
                  value={form[key]}
                  onChange={set(key)}
                />
              </div>
            </div>
          ))}

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type={showPwd ? 'text' : 'password'}
                className="form-input"
                placeholder="Min. 8 chars, upper + lower + digit"
                style={{ paddingLeft: 40, paddingRight: 40 }}
                value={form.password}
                onChange={set('password')}
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
              }}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full" style={{ padding: 12, marginTop: 4 }} disabled={loading}>
            {loading
              ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div className="spinner" />Creating...</span>
              : <><ArrowRight size={16} /> Create Account</>
            }
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--brand-400)', fontWeight: 600 }}>Sign in →</Link>
        </p>
      </div>
    </div>
  )
}
