import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import Sidebar from '../components/Sidebar'
import { codingAPI, interviewAPI } from '../api'
import toast from 'react-hot-toast'
import {
  Play, Send, RefreshCw, CheckCircle, XCircle,
  Clock, Cpu, Trophy, Loader, ChevronDown
} from 'lucide-react'

const LANGUAGES = ['python', 'javascript', 'java', 'cpp', 'c', 'typescript', 'go', 'rust']
const MONACO_LANG = { cpp: 'cpp', c: 'c', python: 'python', javascript: 'javascript', java: 'java', typescript: 'typescript', go: 'go', rust: 'rust' }

export default function CodingArena() {
  const { id }    = useParams()
  const navigate  = useNavigate()

  const [problem, setProblem]       = useState(null)
  const [loadingProblem, setLoadingProblem] = useState(true)
  const [language, setLanguage]     = useState('python')
  const [code, setCode]             = useState('')
  const [running, setRunning]       = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [output, setOutput]         = useState(null)
  const [review, setReview]         = useState(null)
  const [activeTab, setActiveTab]   = useState('problem')

  const [interview, setInterview]   = useState(null)

  useEffect(() => {
    interviewAPI.session(id).then(({ data }) => setInterview(data.interview)).catch(() => {})
  }, [id])

  const fetchProblem = (diff = 'Medium', company = 'Generic') => {
    setLoadingProblem(true)
    setOutput(null)
    setReview(null)
    codingAPI.getProblem(diff, company)
      .then(({ data }) => {
        setProblem(data)
        setCode(data.starter_code?.[language] || '')
      })
      .catch(() => toast.error('Failed to generate problem'))
      .finally(() => setLoadingProblem(false))
  }

  useEffect(() => {
    if (interview === null) return   // wait for interview data before fetching
    fetchProblem(interview.difficulty || 'Medium', interview.company_mode || 'Generic')
  }, [interview?.id])

  useEffect(() => {
    if (problem?.starter_code?.[language]) {
      setCode(problem.starter_code[language])
    }
  }, [language])

  const runCode = async () => {
    if (!code.trim()) return
    setRunning(true)
    setOutput(null)
    try {
      const { data } = await codingAPI.runCode({ language, source_code: code, stdin: '' })
      setOutput(data)
    } catch (err) {
      toast.error('Run failed')
    } finally {
      setRunning(false)
    }
  }

  const submitCode = async () => {
    if (!code.trim()) return
    if (!problem) return
    setSubmitting(true)
    setOutput(null)
    setReview(null)
    try {
      const { data } = await codingAPI.submitCode({
        interview_id:      parseInt(id),
        problem_title:     problem.title,
        problem_statement: problem.description,
        language,
        source_code:       code,
        test_cases:        problem.test_cases || [],
      })
      setOutput(data.run_result)
      setReview(data.review)
      setActiveTab('review')
      toast.success(`${data.passed_cases}/${data.total_cases} test cases passed`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Submit failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: 0 }}>
        <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>

          {/* Top toolbar */}
          <div style={{
            padding: '8px 20px', background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>⚡ Coding Arena</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => fetchProblem(interview?.difficulty, interview?.company_mode)}
                title="New problem"
              >
                <RefreshCw size={14} /> New Problem
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/interview/${id}`)}>
                ← Back to Interview
              </button>
            </div>
          </div>

          <div className="code-arena" style={{ flex: 1, minHeight: 0, borderRadius: 0, border: 'none' }}>

            {/* ── Left: Problem + Review ── */}
            <div className="problem-panel">
              <div className="tabs" style={{ marginBottom: 16 }}>
                <div className={`tab ${activeTab === 'problem' ? 'active' : ''}`} onClick={() => setActiveTab('problem')}>Problem</div>
                <div className={`tab ${activeTab === 'review' ? 'active' : ''}`} onClick={() => setActiveTab('review')}>
                  AI Review {review && '✓'}
                </div>
              </div>

              {activeTab === 'problem' && (
                loadingProblem ? (
                  <div className="loading-overlay"><div className="spinner" /><span style={{ fontSize: '0.85rem' }}>Generating problem…</span></div>
                ) : problem ? (
                  <>
                    <h3 style={{ marginBottom: 8 }}>{problem.title}</h3>
                    <div style={{ marginBottom: 16 }}>
                      <span className={`badge ${interview?.difficulty === 'Easy' ? 'badge-success' : interview?.difficulty === 'Hard' ? 'badge-error' : 'badge-warn'}`}>
                        {interview?.difficulty || 'Medium'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.88rem', marginBottom: 20, color: 'var(--text-primary)', lineHeight: 1.7 }}>
                      {problem.description}
                    </p>

                    {problem.examples?.length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <h4 style={{ fontSize: '0.85rem', marginBottom: 10, color: 'var(--text-secondary)' }}>Examples</h4>
                        {problem.examples.map((ex, i) => (
                          <div key={i} style={{
                            background: 'var(--bg-muted)', borderRadius: 8, padding: '10px 12px',
                            marginBottom: 8, fontFamily: 'monospace', fontSize: '0.82rem',
                          }}>
                            <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Input: <span style={{ color: 'var(--text-primary)' }}>{ex.input}</span></div>
                            <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Output: <span style={{ color: 'var(--accent-400)' }}>{ex.output}</span></div>
                            {ex.explanation && <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{ex.explanation}</div>}
                          </div>
                        ))}
                      </div>
                    )}

                    {problem.constraints?.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: '0.85rem', marginBottom: 10, color: 'var(--text-secondary)' }}>Constraints</h4>
                        <ul style={{ paddingLeft: 16 }}>
                          {problem.constraints.map((c, i) => (
                            <li key={i} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : null
              )}

              {activeTab === 'review' && review && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Score */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className={`score-ring ${review.correctness_score >= 7 ? 'score-high' : review.correctness_score >= 4 ? 'score-medium' : 'score-low'}`}
                      style={{ width: 56, height: 56, fontSize: '1rem' }}>
                      {review.correctness_score?.toFixed(1)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>Correctness Score</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>AI Code Review</div>
                    </div>
                  </div>

                  {/* Complexity */}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1, background: 'var(--bg-muted)', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>TIME</div>
                      <div style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--brand-400)', fontSize: '0.9rem' }}>{review.time_complexity}</div>
                    </div>
                    <div style={{ flex: 1, background: 'var(--bg-muted)', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>SPACE</div>
                      <div style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-400)', fontSize: '0.9rem' }}>{review.space_complexity}</div>
                    </div>
                  </div>

                  {review.strengths?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8 }}>✅ STRENGTHS</div>
                      <div className="tag-list">
                        {review.strengths.map((s, i) => <span key={i} className="tag tag-success">{s}</span>)}
                      </div>
                    </div>
                  )}
                  {review.weaknesses?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8 }}>⚠️ WEAKNESSES</div>
                      <div className="tag-list">
                        {review.weaknesses.map((w, i) => <span key={i} className="tag tag-error">{w}</span>)}
                      </div>
                    </div>
                  )}
                  {review.optimization_suggestions?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8 }}>💡 SUGGESTIONS</div>
                      <ul style={{ paddingLeft: 16 }}>
                        {review.optimization_suggestions.map((s, i) => (
                          <li key={i} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 6 }}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Right: Editor ── */}
            <div className="editor-panel">
              {/* Editor toolbar */}
              <div className="editor-toolbar">
                <div style={{ position: 'relative' }}>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="form-select"
                    style={{ width: 130, padding: '5px 10px', fontSize: '0.82rem' }}
                  >
                    {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={runCode}
                    disabled={running || submitting}
                  >
                    {running ? <Loader size={13} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Play size={13} />}
                    Run
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={submitCode}
                    disabled={running || submitting || !problem}
                  >
                    {submitting ? <Loader size={13} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Send size={13} />}
                    Submit
                  </button>
                </div>
              </div>

              {/* Monaco Editor */}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <Editor
                  height="100%"
                  language={MONACO_LANG[language] || language}
                  value={code}
                  onChange={(v) => setCode(v || '')}
                  theme="vs-dark"
                  options={{
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    fontLigatures: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    lineNumbersMinChars: 3,
                    padding: { top: 12, bottom: 12 },
                    wordWrap: 'on',
                    smoothScrolling: true,
                    cursorSmoothCaretAnimation: 'on',
                  }}
                />
              </div>

              {/* Output */}
              {output && (
                <div className="editor-output">
                  <div style={{ display: 'flex', gap: 12, marginBottom: 8, alignItems: 'center' }}>
                    <span className={`badge ${output.status === 'Accepted' ? 'badge-success' : 'badge-error'}`}>
                      {output.status === 'Accepted' ? <CheckCircle size={11} /> : <XCircle size={11} />}
                      {output.status}
                    </span>
                    {output.time != null && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} /> {output.time}s
                      </span>
                    )}
                    {output.memory != null && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Cpu size={11} /> {output.memory}KB
                      </span>
                    )}
                  </div>
                  {output.stdout && <pre className="output-line output-stdout">{output.stdout}</pre>}
                  {output.stderr && <pre className="output-line output-stderr">{output.stderr}</pre>}
                  {output.compile_output && <pre className="output-line output-stderr">{output.compile_output}</pre>}
                  {!output.stdout && !output.stderr && !output.compile_output && (
                    <span className="output-info">No output</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
