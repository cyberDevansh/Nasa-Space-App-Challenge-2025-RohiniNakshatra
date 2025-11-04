import { Route, Routes, NavLink, useNavigate } from 'react-router-dom'
import Home from './pages/Home'
import Publications from './pages/Publications'
import PublicationDetail from './pages/PublicationDetail'
import Dashboard from './pages/Dashboard'
import Story from './pages/Story'
import About from './pages/About'
import Summarise from './pages/Summarise'
import SummariseDetail from './pages/SummariseDetail'

export default function App() {
  const navigate = useNavigate()

  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column'}}>
      <header className="navbar" id="nav">
        <div className="navbar-inner">
          <div className="logo" onClick={() => navigate('/') } style={{cursor:'pointer'}}>
            <div className="mark"/>
            <div style={{fontWeight:700}}>NASA Publications</div>
          </div>

          <nav className="nav-links">
            <NavLink to="/" end className={({isActive}) => isActive ? 'active' : ''}>Dashboard</NavLink>
            <NavLink to="/publications" className={({isActive}) => isActive ? 'active' : ''}>Publications</NavLink>
            <a href="/timeline.html" className="" style={{textDecoration:'none',color:'inherit'}}>Story</a>
            <NavLink to="/summarise" className={({isActive}) => isActive ? 'active' : ''}>Summarise</NavLink>
            <a href="/about.html" className="" style={{textDecoration:'none',color:'inherit'}}>About</a>
            <div className="theme-switcher" id="themeToggle" style={{marginLeft:12}}>
              <button className="theme-toggle" id="themeToggle">Theme</button>
            </div>
          </nav>
        </div>
      </header>

      <main style={{flex:1}}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/publications" element={<Publications />} />
          <Route path="/publications/:name" element={<PublicationDetail />} />
          <Route path="/story" element={<Story />} />
          <Route path="/summarise" element={<Summarise />} />
          <Route path="/summarise/:name" element={<SummariseDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/home" element={<Home />} />
        </Routes>
      </main>

      <footer>
        <div className="footer-inner">© {new Date().getFullYear()} NASA Publications Tool</div>
      </footer>
    </div>
  )
}


