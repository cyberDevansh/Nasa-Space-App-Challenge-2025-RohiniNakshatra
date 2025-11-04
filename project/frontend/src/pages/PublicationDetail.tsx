import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getDocument } from '../lib/api'

export default function PublicationDetail() {
  const { name } = useParams()
  const [doc, setDoc] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!name) return
    setLoading(true)
    getDocument(name).then((d) => setDoc(d.document)).catch(() => {}).finally(() => setLoading(false))
  }, [name])

  return (
    <div className="container">
      <h1>{name}</h1>
      <div style={{marginTop:12}} className="card">
        {loading ? <div className="muted">Loading document…</div> : doc ? <pre style={{whiteSpace:'pre-wrap',fontSize:13}}>{JSON.stringify(doc, null, 2)}</pre> : <div className="muted">Document not found.</div>}
      </div>
    </div>
  )
}
