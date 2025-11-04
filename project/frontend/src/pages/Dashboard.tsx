import { useEffect, useState } from 'react'
import { listCategories, listAllDocuments } from '../lib/api'

export default function Dashboard() {
  const [cats, setCats] = useState<string[]>([])
  const [docsCount, setDocsCount] = useState(0)

  useEffect(() => {
    listCategories().then((d) => setCats(d.categories)).catch(() => {})
    listAllDocuments().then((d) => setDocsCount(d.documents.length)).catch(() => {})
  }, [])

  return (
    <div className="container">
      <h1>Dashboard</h1>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12,marginTop:12}}>
        <div className="card">
          <div className="muted">Document count</div>
          <div style={{fontSize:22,fontWeight:700}}>{docsCount}</div>
        </div>
        <div className="card" style={{gridColumn:'span 2'}}>
          <div className="muted">Categories</div>
          <div style={{marginTop:8}}>
            {cats.map(c => <span key={c} style={{display:'inline-block',marginRight:6,marginTop:6,padding:'4px 8px',background:'#f3f4f6',borderRadius:999,fontSize:12}}>{c}</span>)}
          </div>
        </div>
      </div>
    </div>
  )
}
