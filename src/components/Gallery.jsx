import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

function optimizedUrl(url) {
  return url.replace('/upload/', '/upload/f_auto,q_auto,w_400/')
}

export default function Gallery() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
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

    fetchPhotos()
  }, [])

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Galerie</h1>

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
            <figcaption className="px-2 py-1.5 text-xs text-gray-500">
              {photo.groupe || 'Anonyme'}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
