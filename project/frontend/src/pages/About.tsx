export default function About() {
  return (
    <div className="container">
      <h1>About</h1>
      <div className="card" style={{marginTop:12}}>
        <p>NASA Publications Tool — built for exploration and research. This demo app shows how vector search, Neo4j graphs and LLM summarization work together.</p>
        <p>For best results, ensure the backend server is running and the Neo4j connection is healthy.</p>
      </div>
    </div>
  )
}
