# Portail Photo Festival Fanfares

## Contexte

Portail web léger pour permettre à ~300 participants d'un festival de fanfares (2 jours) de déposer et consulter leurs photos.  
Accessible uniquement via **QR code → lien Vercel** (pas de nom de domaine custom).

---

## Stack technique

| Couche | Choix | Pourquoi |
|---|---|---|
| Frontend | **React (Vite)** | Léger, deploy Vercel natif |
| Stockage photos | **Cloudinary** | 25 Go gratuit, CDN, compression auto |
| Base de données | **Supabase** | 500 Mo gratuit, temps réel, API REST auto |
| Hébergement | **Vercel** | Gratuit, deploy via Git, HTTPS natif |

---

## Architecture

```
QR Code (J1 + J2)
      │
      ▼
Portail React (Vercel)
      │
      ├── /upload     → formulaire dépôt photo
      │       │
      │       ├── Upload image → Cloudinary API
      │       └── Enregistrement metadata → Supabase
      │
      └── /galerie    → affichage toutes les photos
              │
              └── Lecture Supabase → URLs Cloudinary
```

---

## Prérequis comptes (tous gratuits)

- [ ] [Cloudinary](https://cloudinary.com) → récupérer `cloud_name`, `upload_preset` (unsigned)
- [ ] [Supabase](https://supabase.com) → récupérer `project URL` + `anon key`
- [ ] [Vercel](https://vercel.com) → connecter le repo GitHub

---

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
├── vite.config.js
└── package.json
```

---

## Variables d'environnement

### `.env.local` (local)
```env
VITE_CLOUDINARY_CLOUD_NAME=xxxx
VITE_CLOUDINARY_UPLOAD_PRESET=xxxx   # preset "unsigned" créé dans Cloudinary
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxx
```

> ⚠️ À renseigner aussi dans **Vercel → Settings → Environment Variables** avant le deploy.

---

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

> Row Level Security : activer RLS + policy `allow insert` et `allow select` pour `anon`.

---

## Flow upload

1. L'utilisateur choisit une photo + saisit son prénom + sélectionne le jour
2. Upload direct vers Cloudinary (unsigned preset) → retourne `secure_url` + `public_id`
3. Insertion dans Supabase avec les métadonnées
4. Confirmation affichée, redirection vers la galerie

---

## Flow galerie

- Lecture de toutes les lignes Supabase (`order by created_at desc`)
- Affichage des images via URL Cloudinary avec transformation auto :  
  `f_auto,q_auto,w_400` (optimisation CDN)
- Filtrage optionnel par jour (onglets Jour 1 / Jour 2)

---

## Estimation stockage

| Hypothèse | Calcul |
|---|---|
| 300 personnes × 5 photos | 1 500 photos |
| Poids moyen après compression Cloudinary | ~800 Ko |
| **Total estimé** | **~1,2 Go** |

→ Largement dans le **free tier Cloudinary (25 Go)** et **Supabase (500 Mo DB)**.

---

## Deploy Vercel

```bash
# Init projet
npm create vite@latest festival-photos -- --template react
cd festival-photos
npm install @supabase/supabase-js

# Push sur GitHub, puis connecter le repo sur vercel.com
# Renseigner les env vars dans Vercel dashboard
# Deploy automatique à chaque push sur main
```

L'URL Vercel générée (`https://festival-photos-xxxx.vercel.app`) est celle à encoder dans les QR codes.

---

## QR Codes

- Générer sur [qr-code-generator.com](https://qr-code-generator.com) ou [qrmonkey.com](https://www.qrmonkey.com)
- Prévoir **2 QR codes distincts** si on veut pré-sélectionner le jour :
  - `https://festival-photos-xxxx.vercel.app/upload?jour=1`
  - `https://festival-photos-xxxx.vercel.app/upload?jour=2`
- Format recommandé : imprimer en **A5 minimum**, contraste élevé

---

## Limites connues / points d'attention

- Cloudinary unsigned preset = **pas d'authentification** → n'importe qui avec le lien peut uploader. Acceptable pour un festival fermé.
- Pas de modération des photos. Prévoir éventuellement un accès admin simple (flag `validé` dans Supabase + vue filtrée).
- Les URLs Vercel changent si on recrée le projet → générer les QR codes **après** le premier deploy.
- Tester sur iOS Safari et Android Chrome avant le festival (comportement `<input type="file" accept="image/*" capture>` variable).
