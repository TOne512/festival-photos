import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

const GROUPE_MAX_LENGTH = 40
const GROUPE_ALLOWED_CHARS = /[^\p{L}\p{N} '-]/gu

function sanitizeGroupe(value) {
  return value.replace(GROUPE_ALLOWED_CHARS, '').slice(0, GROUPE_MAX_LENGTH)
}

export default function UploadForm() {
  const navigate = useNavigate()

  const [groupe, setGroupe] = useState('')
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('idle') // idle | uploading | error
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const cleanGroupe = sanitizeGroupe(groupe).trim()

    if (!cleanGroupe) {
      setError('Indique le nom de ton groupe.')
      return
    }
    if (!file) {
      setError('Choisis une photo.')
      return
    }
    setStatus('uploading')
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData },
      )

      if (!cloudinaryRes.ok) {
        throw new Error("Échec de l'envoi de la photo.")
      }

      const cloudinaryData = await cloudinaryRes.json()

      const { error: insertError } = await supabase.from('photos').insert({
        groupe: cleanGroupe,
        cloudinary_url: cloudinaryData.secure_url,
        cloudinary_public_id: cloudinaryData.public_id,
      })

      if (insertError) throw insertError

      navigate('/galerie')
    } catch (err) {
      setStatus('error')
      setError(err.message || "Une erreur est survenue.")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h1 className="text-xl font-semibold">Déposer une photo</h1>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="groupe">
          Groupe *
        </label>
        <input
          id="groupe"
          type="text"
          required
          maxLength={GROUPE_MAX_LENGTH}
          value={groupe}
          onChange={(e) => setGroupe(sanitizeGroupe(e.target.value))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
          placeholder="Nom de ton groupe"
        />
        <p className="mt-1 text-xs text-gray-500">
          Lettres, chiffres, espaces, apostrophes et tirets uniquement (40 caractères max).
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="photo">
          Photo
        </label>
        <input
          id="photo"
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={status === 'uploading'}
        className="w-full py-3 rounded-lg bg-purple-500 text-white font-medium disabled:opacity-50 hover:bg-purple-600"
      >
        {status === 'uploading' ? 'Envoi en cours…' : 'Upload / Envoyer'}
      </button>
    </form>
  )
}
