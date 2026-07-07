import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import UploadForm from './components/UploadForm.jsx'
import Gallery from './components/Gallery.jsx'

function NavBar() {
  const location = useLocation()

  const linkClass = (path) =>
    `flex-1 text-center py-3 font-medium ${
      location.pathname.startsWith(path)
        ? 'text-purple-600 border-b-2 border-purple-600'
        : 'text-gray-500'
    }`

  return (
    <nav className="flex sticky top-0 bg-white/80 backdrop-blur shadow z-10">
      <Link to="/upload" className={linkClass('/upload')}>
        Déposer
      </Link>
      <Link to="/galerie" className={linkClass('/galerie')}>
        Galerie
      </Link>
    </nav>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100">
      <NavBar />
      <main className="max-w-xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Navigate to="/upload" replace />} />
          <Route path="/upload" element={<UploadForm />} />
          <Route path="/galerie" element={<Gallery />} />
        </Routes>
      </main>
    </div>
  )
}
