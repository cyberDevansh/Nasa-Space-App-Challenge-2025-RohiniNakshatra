import { useEffect, useMemo, useState } from 'react'
import { listAllDocuments, summarizeQuery } from '../lib/api'
import { marked } from 'marked'
import { useNavigate } from 'react-router-dom'

export default function Publications() {
  const [docs, setDocs] = useState<string[]>([])
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    listAllDocuments().then((d) => setDocs(d.documents || [])).catch(() => {})
  }, [])

  const filtered = useMemo(() => {
    const f = filter.toLowerCase()
    return (docs || []).filter((d) => d.toLowerCase().includes(f))
  }, [docs, filter])

  async function summarizeDocument(name: string) {
    setSelected(name)
    setLoading(true)
    try {
      const res = await summarizeQuery(name)
      setSummary(res.generated_output)
    } finally {
      setLoading(false)
    }
  }

  const summaryHtml = useMemo(() => ({ __html: marked.parse(summary || '') }), [summary])

  return (
    <div>
      <section className="content-section">
        <div className="section-container">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <h1 style={{margin:0}}>Publications</h1>
            <div className="muted">{filtered.length} items</div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'360px 1fr',gap:18,marginTop:18}}>
            <aside>
              <div className="card">
                <div style={{display:'flex',gap:8}}>
                  <input placeholder="Filter publications..." value={filter} onChange={(e)=>setFilter(e.target.value)} />
                  <button className="btn" onClick={()=>{setFilter('')}}>Clear</button>
                </div>

                <div style={{height:'60vh',overflow:'auto',marginTop:12}} className="list">
                  {filtered.map((d) => (
                    <div key={d} className={`list-item ${selected===d? 'selected':''}`}>
                      <div style={{maxWidth:'78%'}}>
                        <button onClick={()=>summarizeDocument(d)} style={{background:'none',border:'none',padding:0,textAlign:'left',cursor:'pointer',fontWeight:600}}>{d}</button>
                        <div className="muted" style={{fontSize:12}}>Click title to summarize</div>
                      </div>
                      <div style={{display:'flex',gap:8}}>
                        <button className="btn secondary" onClick={()=>navigate(`/publications/${encodeURIComponent(d)}`)}>Details</button>
                      </div>
                    </div>
                  ))}

                  {filtered.length===0 && <div style={{padding:12}} className="muted">No publications found.</div>}
                </div>
              </div>
            </aside>

            <main>
              <div className="card">
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <h2 style={{margin:0}}>Summary</h2>
                  {selected && <button className="btn secondary" onClick={()=>summarizeDocument(selected)}>{loading? 'Summarizing…':'Refresh'}</button>}
                </div>
                <div className="summary" style={{marginTop:12}}>
                  {selected ? (loading ? <div className="muted">Generating summary for “{selected}”…</div> : <div dangerouslySetInnerHTML={summaryHtml} />) : <div className="muted">Select a publication to generate its summary.</div>}
                </div>
              </div>
            </main>
          </div>
        </div>
      </section>
    </div>
  )
}


