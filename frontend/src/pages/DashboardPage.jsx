import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyticsAPI, interviewAPI } from '../api'
import Sidebar from '../components/Sidebar'
import ConfirmDialog from '../components/ConfirmDialog'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid
} from 'recharts'
import {
  Trophy, MessageSquare, Target, TrendingUp, Plus,
  Zap, AlertTriangle, Star, History, ArrowRight, Play, Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

const statusColor = {
  completed:   '#10b981',
  in_progress: '#6366f1',
  abandoned:   '#71717a',
}

const diffColor = {
  Easy: '#10b981',
  Medium: '#f97316',
  Hard: '#ef4444',
}

function ScoreRing({ score }) {
  if (score == null) return <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>
  const cls = score >= 7 ? 'score-high' : score >= 4 ? 'score-medium' : 'score-low'
  return <div className={`score-ring ${cls}`}>{score?.toFixed(1)}</div>
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: '0.85rem' }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ color: 'var(--brand-400)', fontWeight: 700 }}>{payload[0]?.value?.toFixed(1)} / 10</div>
    </div>
  )
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [data, setData]       = useState(null)
  const [loading, setLoading]  = useState(true)

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]         = useState(false)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await interviewAPI.delete(deleteTarget.id)
      toast.success('Interview deleted')
      setData((prev) => ({
        ...prev,
        recent_interviews: prev.recent_interviews.filter((iv) => iv.id !== deleteTarget.id),
      }))
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete interview')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  useEffect(() => {
    if (authLoading) return   // wait for token to be available
    analyticsAPI.dashboard()
      .then((r) => setData(r.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [authLoading])

  const topicChartData = data
    ? Object.entries(data.topic_scores || {}).map(([topic, score]) => ({ topic: topic.length > 14 ? topic.slice(0, 14) + '…' : topic, score }))
    : []

  const trendData = (data?.score_trend || []).map((t, i) => ({
    name: `#${i + 1}`,
    score: t.score,
  }))

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 className="page-title">Dashboard 👋</h1>
            <p className="page-subtitle">Welcome back, {user?.full_name?.split(' ')[0]}! Let's keep practising.</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/interview/setup')}>
            <Plus size={16} /> New Interview
          </button>
        </div>

        {loading ? (
          <div className="loading-overlay"><div className="spinner spinner-lg" /><span>Loading your stats…</span></div>
        ) : (
          <>
            {/* Stats */}
            <div className="stats-grid">
              {[
                { label: 'Total Interviews', value: data?.total_interviews ?? 0, icon: <MessageSquare size={20} />, color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
                { label: 'Questions Answered', value: data?.total_questions_answered ?? 0, icon: <Target size={20} />, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
                { label: 'Avg. Score', value: data?.average_score != null ? `${data.average_score.toFixed(1)}/10` : '—', icon: <Trophy size={20} />, color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
                { label: 'Strong Areas', value: data?.strong_areas?.length ?? 0, icon: <Star size={20} />, color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
              ].map((s) => (
                <div key={s.label} className="stat-card">
                  <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              {/* Topic scores */}
              <div className="card">
                <h4 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={16} color="var(--brand-400)" /> Topic Scores
                </h4>
                {topicChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={topicChartData} barSize={28}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="topic" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 10]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                      <Bar dataKey="score" fill="var(--brand-500)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state" style={{ padding: '30px 0' }}>
                    <div className="empty-icon"><TrendingUp size={24} /></div>
                    <span style={{ fontSize: '0.85rem' }}>Complete interviews to see topic scores</span>
                  </div>
                )}
              </div>

              {/* Score trend */}
              <div className="card">
                <h4 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Zap size={16} color="var(--accent-400)" /> Score Trend
                </h4>
                {trendData.length > 1 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 10]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="score" stroke="var(--accent-500)" strokeWidth={2.5} dot={{ fill: 'var(--accent-500)', r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state" style={{ padding: '30px 0' }}>
                    <div className="empty-icon"><Zap size={24} /></div>
                    <span style={{ fontSize: '0.85rem' }}>Complete 2+ interviews to see trend</span>
                  </div>
                )}
              </div>
            </div>

            {/* Areas + Recent */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
              {/* Weak / Strong areas */}
              <div className="card">
                <h4 style={{ marginBottom: 16 }}>Performance Areas</h4>
                {(data?.weak_areas?.length > 0 || data?.strong_areas?.length > 0) ? (
                  <>
                    {data.strong_areas?.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <Star size={13} color="var(--accent-400)" />
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>STRONG</span>
                        </div>
                        <div className="tag-list">
                          {data.strong_areas.map((a) => <span key={a} className="tag tag-success">{a}</span>)}
                        </div>
                      </div>
                    )}
                    {data.weak_areas?.length > 0 && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <AlertTriangle size={13} color="var(--warn-400)" />
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>NEEDS WORK</span>
                        </div>
                        <div className="tag-list">
                          {data.weak_areas.map((a) => <span key={a} className="tag tag-error">{a}</span>)}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="empty-state" style={{ padding: '20px 0' }}>
                    <span style={{ fontSize: '0.85rem' }}>No data yet</span>
                  </div>
                )}
              </div>

              {/* Recent interviews */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <History size={16} color="var(--text-secondary)" /> Recent Interviews
                  </h4>
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate('/history')} style={{ fontSize: '0.8rem' }}>
                    View all <ArrowRight size={12} />
                  </button>
                </div>
                {data?.recent_interviews?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {data.recent_interviews.map((iv) => (
                      <div key={iv.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 14px', background: 'var(--bg-muted)',
                          borderRadius: 10,
                          transition: 'background 150ms',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-muted)'}
                      >
                        <div
                          style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                          onClick={() => iv.status === 'in_progress' ? navigate(`/interview/${iv.id}`) : navigate(`/history/${iv.id}`)}
                        >
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 2 }}>{iv.interview_type}</div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            <span style={{ color: diffColor[iv.difficulty] || 'var(--text-muted)' }}>{iv.difficulty}</span>
                            <span>·</span>
                            <span>{iv.company_mode}</span>
                            <span>·</span>
                            <span>{iv.total_questions}Q</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          {iv.status === 'in_progress' ? (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => navigate(`/interview/${iv.id}`)}
                              style={{ gap: 4 }}
                            >
                              <Play size={12} /> Resume
                            </button>
                          ) : (
                            <>
                              <ScoreRing score={iv.overall_score} />
                              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: statusColor[iv.status] || 'var(--text-muted)' }}>
                                {iv.status.replace('_', ' ')}
                              </span>
                            </>
                          )}
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(iv) }}
                            title="Delete interview"
                            style={{ padding: '4px 6px', color: 'var(--error-400)', lineHeight: 1 }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon"><MessageSquare size={24} /></div>
                    <span style={{ fontSize: '0.85rem' }}>No interviews yet</span>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate('/interview/setup')}>
                      Start your first
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Interview?"
        message={
          deleteTarget
            ? `This will permanently delete your "${deleteTarget.interview_type}" interview from ${new Date(deleteTarget.created_at).toLocaleDateString()} and all its questions and responses.`
            : ''
        }
        confirm={deleting ? 'Deleting…' : 'Delete'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
