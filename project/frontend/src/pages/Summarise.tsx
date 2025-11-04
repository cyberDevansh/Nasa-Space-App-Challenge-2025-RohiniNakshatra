import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listSummaries } from '../lib/api'

export default function Summarise() {
  const [summaries, setSummaries] = useState<{ name: string; summary: string }[] | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    listSummaries()
      .then((d) => setSummaries(d.summaries || []))
      .catch(() => setSummaries([]))
      .finally(() => setLoading(false))
  }, [])

  function openDetail(name: string) {
    // navigate to detail page; encode name to keep URL safe
    navigate(`/summarise/${encodeURIComponent(name)}`)
  }

  return (
    <div className="container">
      <h1>Summarise (DB)</h1>
      <div style={{ marginTop: 12 }}>
        {loading ? (
          <div className="muted">Loading summaries…</div>
        ) : summaries && summaries.length ? (
          <div style={{ display: 'grid', gap: 12 }}>
            {summaries.map((s) => (
              <div key={s.name} className="card fade-in">
                <div
                  className="summary-box"
                  role="link"
                  tabIndex={0}
                  onClick={() => openDetail(s.name)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') openDetail(s.name)
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{s.name}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="muted">No pre-generated summaries found in the database.</div>
        )}
      </div>
    </div>
  )
}
