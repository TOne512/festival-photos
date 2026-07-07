# Portail Photo Festival Fanfares — Design

## Contexte

Portail web léger pour permettre à ~300 participants d'un festival de fanfares (2 jours) de déposer et consulter leurs photos. Accessible uniquement via **QR code → lien Vercel** (pas de nom de domaine custom).

## Stack technique

| Couche | Choix | Pourquoi |
|---|---|---|
| Frontend | React (Vite) | Léger, deploy Vercel natif |
| Style | Tailwind CSS | Mobile-first, itération rapide (usage quasi exclusif sur téléphone) |
| Stockage photos | Cloudinary | 25 Go gratuit, CDN, compression auto |
| Base de données | Supabase | 500 Mo gratuit, temps réel, API REST auto |
| Hébergement | Vercel | Gratuit, deploy via Git, HTTPS natif |

## Architecture

```
QR Code (J1 + J2)
      │
      ▼
Portail React (Vercel)
      │
      ├── /upload     → formulaire dépôt photo
      │       │
      │       ├── Upload image → Cloudinary API (unsigned preset)
      │       └── Enregistrement metadata → Supabase
      │
      └── /galerie    → affichage toutes les photos
              │
              └── Lecture Supabase → URLs Cloudinary
```

## Périmètre (MVP strict)

- `/upload` et `/galerie` uniquement.
- **Pas** de page admin, **pas** d'authentification, **pas** de modération. Peut être ajouté plus tard si besoin réel.
- Déploiement (GitHub + Vercel) hors scope de ce build : le projet est scaffoldé et prêt à être poussé/déployé par l'utilisateur ensuite.

## Structure du projet

```
festival-photos/
├── public/
├── src/
│   ├── components/
│   │   ├── UploadForm.jsx      # Formulaire upload
│   │   └── Gallery.jsx         # Galerie photos
│   ├── lib/
│   │   └── supabase.js         # Client Supabase
│   ├── App.jsx                 # Router (upload / galerie)
│   └── main.jsx
├── .env.local                  # Variables d'environnement (ne pas commiter)
├── .env.example
├── tailwind.config.js
├── vite.config.js
└── package.json
```

## Variables d'environnement

```env
VITE_CLOUDINARY_CLOUD_NAME=xxxx
VITE_CLOUDINARY_UPLOAD_PRESET=xxxx   # preset "unsigned" créé dans Cloudinary
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxx
```

À renseigner aussi dans Vercel → Settings → Environment Variables avant le deploy (fait par l'utilisateur, hors scope).

## Schéma Supabase

Table `photos` :

```sql
create table photos (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  auteur      text,
  jour        smallint,          -- 1 ou 2
  cloudinary_url text not null,
  cloudinary_public_id text
);
```

Row Level Security : activer RLS + policy `allow insert` et `allow select` pour `anon`.

## Composants

- **`UploadForm.jsx`** — L'utilisateur choisit une photo, saisit son prénom, sélectionne le jour. Upload direct vers Cloudinary (unsigned preset) → retourne `secure_url` + `public_id`. Insertion dans Supabase avec les métadonnées. Confirmation affichée, redirection vers la galerie.
- **`Gallery.jsx`** — Lecture de toutes les lignes Supabase (`order by created_at desc`). Affichage des images via URL Cloudinary avec transformation auto `f_auto,q_auto,w_400` (optimisation CDN). Filtrage optionnel par jour (onglets Jour 1 / Jour 2).
- **`lib/supabase.js`** — Client Supabase unique, importé par `UploadForm` et `Gallery`.
- **`App.jsx`** — Routing (react-router) entre `/upload` et `/galerie`.

## Estimation stockage

| Hypothèse | Calcul |
|---|---|
| 300 personnes × 5 photos | 1 500 photos |
| Poids moyen après compression Cloudinary | ~800 Ko |
| **Total estimé** | **~1,2 Go** |

Largement dans le free tier Cloudinary (25 Go) et Supabase (500 Mo DB).

## QR Codes

- Générer après le premier deploy (l'URL Vercel est générée à ce moment-là).
- Prévoir 2 QR codes distincts pour pré-sélectionner le jour :
  - `https://festival-photos-xxxx.vercel.app/upload?jour=1`
  - `https://festival-photos-xxxx.vercel.app/upload?jour=2`
- Format recommandé : A5 minimum, contraste élevé.

## Limites connues / points d'attention

- Cloudinary unsigned preset = pas d'authentification → n'importe qui avec le lien peut uploader. Acceptable pour un festival fermé.
- Pas de modération des photos dans ce MVP.
- Les URLs Vercel changent si on recrée le projet → générer les QR codes après le premier deploy.
- Tester sur iOS Safari et Android Chrome avant le festival (comportement `<input type="file" accept="image/*" capture>` variable).

## Hors scope de cette session

- Création des comptes Cloudinary/Supabase (Cloudinary déjà fait par l'utilisateur ; Supabase à faire par lui ensuite).
- Push GitHub et connexion Vercel.
- Génération des QR codes (dépend de l'URL Vercel, générée après deploy).
