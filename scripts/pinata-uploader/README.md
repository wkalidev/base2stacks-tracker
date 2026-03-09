# B2S Badge Uploader — Pinata IPFS

Génère 200+ badges SVG et les upload sur Pinata IPFS.
**Aucune dépendance native** — fonctionne sur Windows/Mac/Linux.

## Setup

```bash
npm install
```

## Usage

### 1. Test sans upload
```bash
npm run dry-run
```

### 2. Upload 200 badges
```bash
# Windows
set PINATA_JWT=eyJhbGc...
node upload-badges.js --from 1 --to 200

# Mac/Linux
PINATA_JWT=eyJhbGc... npm run upload:200
```

### 3. Upload une range spécifique
```bash
node upload-badges.js --from 1 --to 9999 --key eyJhbGc... --batch 5
```

### 4. Après upload → mettre à jour NFTMarketplace.tsx
```bash
node update-marketplace.js
# Copie badges-output/ipfs-badges.ts dans NFTMarketplace.tsx
```

## Options

| Flag | Défaut | Description |
|------|--------|-------------|
| `--key` | env PINATA_JWT | JWT Pinata |
| `--from` | 1 | Seed de départ |
| `--to` | 200 | Seed de fin |
| `--batch` | 3 | Uploads simultanés |
| `--out` | ./badges-output | Dossier de sortie |
| `--dry-run` | false | Test sans upload |

## Obtenir le JWT Pinata

```
app.pinata.cloud → API Keys → New Key → ✅ Admin → Generate
Copie le JWT token (commence par eyJ...)
```

## Output

```
badges-output/
├── svg/                     ← Badges SVG 400x400
├── metadata/                ← JSON metadata
├── upload-results.json      ← Tous les CIDs + stats
├── failed.json              ← Uploads ratés (retry)
└── ipfs-badges.ts           ← Prêt pour NFTMarketplace.tsx
```