import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD
const SESSION_KEY = 'festival_admin_authed'

function optimizedUrl(url) {
  return url.replace('/upload/', '/upload/f_auto,q_auto,w_200/')
}

function PasswordGate({ onSuccess }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true')
      onSuccess()
    } else {
      setError('Mot de passe incorrect.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xs">
      <h1 className="text-xl font-semibold">Accès admin</h1>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Mot de passe"
        className="w-full rounded-lg border border-gray-300 px-3 py-2"
        autoFocus
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        className="w-full py-3 rounded-lg bg-purple-500 text-white font-medium hover:bg-purple-600"
      >
        Entrer
      </button>
    </form>
  )
}

function AdminGallery() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  async function fetchPhotos() {
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setPhotos(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchPhotos()
  }, [])

  async function handleDelete(id) {
    if (!confirm('Supprimer cette photo ?')) return
    setDeletingId(id)
    const { error: deleteError } = await supabase.from('photos').delete().eq('id', id)
    if (deleteError) {
      setError(deleteError.message)
    } else {
      setPhotos((prev) => prev.filter((p) => p.id !== id))
    }
    setDeletingId(null)
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Admin — Galerie</h1>

      {loading && <p className="text-gray-500">Chargement…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && photos.length === 0 && (
        <p className="text-gray-500">Aucune photo pour le moment.</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {photos.map((photo) => (
          <figure key={photo.id} className="rounded-lg overflow-hidden bg-white shadow-sm">
            <img
              src={optimizedUrl(photo.cloudinary_url)}
              alt={photo.groupe ? `Photo de ${photo.groupe}` : 'Photo du festival'}
              className="w-full h-40 object-cover"
              loading="lazy"
            />
            <figcaption className="px-2 py-1.5 flex items-center justify-between">
              <span className="text-xs text-gray-500">{photo.groupe || 'Anonyme'}</span>
              <button
                onClick={() => handleDelete(photo.id)}
                disabled={deletingId === photo.id}
                className="text-xs text-red-600 font-medium disabled:opacity-50"
              >
                {deletingId === photo.id ? '…' : 'Supprimer'}
              </button>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}

export default function Admin() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === 'true')

  if (!authed) {
    return <PasswordGate onSuccess={() => setAuthed(true)} />
  }

  return <AdminGallery />
}
