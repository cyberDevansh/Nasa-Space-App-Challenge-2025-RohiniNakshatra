import { useEffect, useMemo, useState } from 'react'
import { listCategories, searchByNodes, summarizeQuery, type SearchResults } from '../lib/api'
import { marked } from 'marked'

export default function Home() {
  const [categories, setCategories] = useState<string[]>([])
  const [catsLoading, setCatsLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<SearchResults['results']>([])
  const [summarizing, setSummarizing] = useState(false)
  const [summary, setSummary] = useState<string>('')

  useEffect(() => {
    setCatsLoading(true)
    listCategories().then((d) => setCategories(d.categories || [])).catch(() => {}).finally(()=>setCatsLoading(false))
  }, [])

  async function onSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    try {
      const data = await searchByNodes(query, 20)
      setResults(data.results)
    } finally {
      setSearching(false)
    }
  }

  async function onSummarize() {
    if (!query.trim()) return
    setSummarizing(true)
    try {
      const data = await summarizeQuery(query)
      setSummary(data.generated_output)
    } finally {
      setSummarizing(false)
    }
  }

  const summaryHtml = useMemo(() => ({ __html: marked.parse(summary || '') }), [summary])

  return (
    <div className="container">
      <section className="hero">
        <div>
          <h1>Explore NASA Publications</h1>
          <p className="muted">Search entities, organisms, compounds, and people across publications, then summarize relevant sections instantly.</p>
          <div style={{marginTop:10}}>
            {catsLoading ? <div className="muted">Loading categories…</div> : (
              categories.slice(0,12).map((c, i) => {
                const colorIdx = i % 6
                const bg = ['#e6f2ff','#fff1e6','#eef6ff','#f0fdf4','#fff0f6','#f8fafc'][colorIdx]
                const accent = ['#2563eb','#d97706','#3b82f6','#16a34a','#db2777','#0f172a'][colorIdx]
                return (
                  <button key={c} className="chip fade-in" onClick={() => { setQuery(c); onSearch(new Event('submit') as any) }} style={{background:bg,color:accent,border:'none'}}>{c}</button>
                )
              })
            )}
          </div>
        </div>

        <div style={{minWidth:320}} className="card">
          <form onSubmit={onSearch}>
            <div className="search">
              <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search by entity, organism, compound, or person..." />
              <button className="btn" disabled={searching}>{searching? 'Searching…':'Search'}</button>
            </div>
            <div style={{marginTop:10}}>
              <button type="button" className="btn secondary" onClick={onSummarize} disabled={summarizing || !query.trim()}>{summarizing? 'Summarizing…':'Summarize'}</button>
            </div>
          </form>
        </div>
      </section>

      <section style={{marginTop:20}}>
        <h2>Top Matches</h2>
        {results.length === 0 ? <p className="muted">No results yet. Try a search.</p> : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12}}>
            {results.map(r => (
              <div key={r.document} className="card">
                <div style={{fontWeight:600}}>{r.document}</div>
                <div className="muted" style={{fontSize:13}}>Relevance: {r.max_score.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {summary && (
        <section style={{marginTop:20}}>
          <h2>Summarization</h2>
          <div className="card" style={{marginTop:8}} dangerouslySetInnerHTML={summaryHtml} />
        </section>
      )}
    </div>
  )
}


