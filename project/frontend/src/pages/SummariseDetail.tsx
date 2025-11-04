import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getDocument } from '../lib/api'

export default function SummariseDetail() {
  const { name } = useParams<{ name: string }>()
  const navigate = useNavigate()
  const [doc, setDoc] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!name) return
    setLoading(true)
    const decoded = decodeURIComponent(name)
    getDocument(decoded)
      .then((d) => setDoc(d.document || d))
      .catch(() => setDoc(null))
      .finally(() => setLoading(false))
  }, [name])

  return (
    <div className="container">
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <button className="btn secondary" onClick={() => navigate(-1)}>← Back</button>
        <h2 style={{margin:0}}>Publication</h2>
      </div>

      <div style={{marginTop:16}}>
        {loading ? <div className="muted">Loading…</div> : (
          doc ? (
            <div className="card">
              <h3 style={{marginTop:0}}>{doc.get ? doc.get('name') : doc.name || 'Untitled'}</h3>
              { (doc.get && doc.get('summary')) || doc.summary ? (
                <div style={{marginTop:8,whiteSpace:'pre-wrap'}} className="muted">{ (doc.get && doc.get('summary')) || doc.summary }</div>
              ) : <div className="muted">No summary available for this document.</div> }
            </div>
          ) : <div className="muted">Document not found.</div>
        )}
      </div>
    </div>
  )
}
