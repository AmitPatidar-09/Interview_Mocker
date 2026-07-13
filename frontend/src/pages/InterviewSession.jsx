import { useState, useEffect, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { interviewAPI } from '../api'
import Sidebar from '../components/Sidebar'
import toast from 'react-hot-toast'
import {
  Send, Brain, User, CheckCircle, XCircle, Lightbulb,
  ChevronRight, Flag, Code2, Star
} from 'lucide-react'

function EvalCard({ evaluation }) {
  return (
    <div className="eval-panel" style={{ marginTop: 16 }}>
      <div className="eval-header">
        <span style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Star size={15} color="var(--warn-400)" /> Evaluation
        </span>
        <div className={`score-ring ${evaluation.score >= 7 ? 'score-high' : evaluation.score >= 4 ? 'score-medium' : 'score-low'}`}
          style={{ width: 44, height: 44, fontSize: '0.9rem' }}>
          {evaluation.score}/10
        </div>
      </div>
      <div className="eval-body">
        {evaluation.strengths?.length > 0 && (
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
              <CheckCircle size={12} color="var(--accent-400)" /> STRENGTHS
            </div>
            <div className="tag-list">
              {evaluation.strengths.map((s, i) => <span key={i} className="tag tag-success">{s}</span>)}
            </div>
          </div>
        )}
        {evaluation.weaknesses?.length > 0 && (
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
              <XCircle size={12} color="var(--error-400)" /> AREAS TO IMPROVE
            </div>
            <div className="tag-list">
              {evaluation.weaknesses.map((w, i) => <span key={i} className="tag tag-error">{w}</span>)}
            </div>
          </div>
        )}
        {evaluation.ideal_answer && (
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
              <Lightbulb size={12} color="var(--brand-400)" /> IDEAL ANSWER
            </div>
            <div style={{
              background: 'var(--bg-muted)', borderRadius: 10, padding: '12px 14px',
              fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7,
            }}>
              {evaluation.ideal_answer}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function InterviewSession() {
  const { id }        = useParams()
  const { state }     = useLocation()
  const navigate      = useNavigate()
  const chatRef       = useRef(null)

  // Initialise interview from navigation state (passed from InterviewSetup)
  const [interview, setInterview]         = useState(state?.interview || null)
  const [messages, setMessages]           = useState([])
  const [currentQ, setCurrentQ]           = useState(state?.firstQuestion || null)
  const [answer, setAnswer]               = useState('')
  const [loading, setLoading]             = useState(!state?.firstQuestion)
  const [submitting, setSubmitting]       = useState(false)
  const [lastEval, setLastEval]           = useState(null)
  const [completing, setCompleting]       = useState(false)

  // Count of questions asked vs answered for accurate progress display
  const questionCount  = messages.filter(m => m.role === 'question').length
  const answeredCount  = messages.filter(m => m.role === 'answer').length
  const maxQ           = 10
  const progress       = Math.min((answeredCount / maxQ) * 100, 100)

  // Fix #26: Use a ref to track initialisation instead of relying on stale deps
  const initRef = useRef(false)
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    if (!state?.firstQuestion) {
      // Resuming an in-progress session — load from API
      interviewAPI.session(id).then(({ data }) => {
        setInterview(data.interview)
        setMessages(data.messages)
        setCurrentQ(data.current_question)
        setLoading(false)
      }).catch(() => { toast.error('Failed to load session'); setLoading(false) })
    } else {
      // Fresh session — seed first question as a message
      setMessages([{ role: 'question', content: state.firstQuestion.content, order_index: 0 }])
      setLoading(false)
    }
  }, [id, state])

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages, lastEval])

  const submitAnswer = async () => {
    if (!answer.trim()) return
    if (!currentQ) return toast.error('No active question')
    setSubmitting(true)
    const answerText = answer.trim()
    setAnswer('')

    // Optimistically add user message
    setMessages((prev) => [...prev, { role: 'answer', content: answerText, order_index: currentQ.order_index }])

    try {
      const { data } = await interviewAPI.evaluate({
        interview_id: parseInt(id),
        question_id:  currentQ.id,
        answer_text:  answerText,
      })
      setLastEval(data.evaluation)
      if (data.next_question) {
        setCurrentQ(data.next_question)
        setTimeout(() => {
          setMessages((prev) => [...prev, { role: 'question', content: data.next_question.content, order_index: data.next_question.order_index }])
          setLastEval(null)
        }, 1800)
      } else {
        setCurrentQ(null)
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Submission failed')
      // Remove optimistic answer on error
      setMessages((prev) => prev.filter((_, i) => i !== prev.length - 1))
    } finally {
      setSubmitting(false)
    }
  }

  const completeInterview = async () => {
    setCompleting(true)
    try {
      await interviewAPI.complete(parseInt(id))
      toast.success('Interview completed! 🎉')
      navigate(`/history/${id}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to complete')
    } finally {
      setCompleting(false)
    }
  }

  if (loading) return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="loading-overlay"><div className="spinner spinner-lg" /><span>Loading session…</span></div>
      </main>
    </div>
  )

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>

          {/* Top bar */}
          <div style={{
            padding: '12px 24px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bg-surface)',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {answeredCount} of {maxQ} answered
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--brand-400)', fontWeight: 600 }}>
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              {interview?.interview_type === 'DSA' && (
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/interview/${id}/coding`)}>
                  <Code2 size={14} /> Coding Arena
                </button>
              )}
              <button
                className="btn btn-danger btn-sm"
                onClick={completeInterview}
                disabled={completing || questionCount === 0}
              >
                <Flag size={14} /> {completing ? 'Finishing…' : 'End Interview'}
              </button>
            </div>
          </div>

          {/* Chat */}
          <div ref={chatRef} className="chat-container" style={{ overflowY: 'auto', flex: 1 }}>
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'question' ? <Brain size={16} /> : <User size={16} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="message-bubble">{msg.content}</div>
                  {msg.score != null && (
                    <div style={{ marginTop: 6, display: 'flex', justifyContent: 'flex-end' }}>
                      <span className={`badge ${msg.score >= 7 ? 'badge-success' : msg.score >= 4 ? 'badge-warn' : 'badge-error'}`}>
                        Score: {msg.score}/10
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Evaluation card shown after answer, before next question */}
            {lastEval && (
              <div style={{ maxWidth: '85%', alignSelf: 'flex-start' }}>
                <EvalCard evaluation={lastEval} />
              </div>
            )}

            {/* Typing indicator when submitting */}
            {submitting && (
              <div className="message question">
                <div className="message-avatar"><Brain size={16} /></div>
                <div className="message-bubble" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {[0, 0.2, 0.4].map((d, i) => (
                    <div key={i} style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: 'var(--brand-400)',
                      animation: `pulse 1.2s ease-in-out ${d}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}

            {/* No more questions */}
            {!currentQ && !submitting && questionCount > 0 && (
              <div style={{
                alignSelf: 'center',
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.25)',
                borderRadius: 14, padding: '20px 28px',
                textAlign: 'center', maxWidth: 420,
              }}>
                <CheckCircle size={32} color="var(--accent-400)" style={{ margin: '0 auto 10px' }} />
                <h4 style={{ marginBottom: 8 }}>All questions answered!</h4>
                <p style={{ fontSize: '0.88rem', marginBottom: 16 }}>Ready to see your results?</p>
                <button className="btn btn-success" onClick={completeInterview} disabled={completing}>
                  <ChevronRight size={16} /> {completing ? 'Finishing…' : 'Complete & View Results'}
                </button>
              </div>
            )}
          </div>

          {/* Answer input */}
          {currentQ && (
            <div className="answer-area">
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                <textarea
                  className="answer-textarea"
                  placeholder="Type your answer here… (Shift+Enter for new line, Enter to send)"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      if (!submitting) submitAnswer()
                    }
                  }}
                  style={{ flex: 1, minHeight: 80, maxHeight: 160 }}
                  disabled={submitting}
                />
                <button
                  className="btn btn-primary"
                  onClick={submitAnswer}
                  disabled={submitting || !answer.trim()}
                  style={{ padding: '12px 16px', alignSelf: 'flex-end', flexShrink: 0 }}
                >
                  {submitting ? <div className="spinner" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
