# LUTRON V1

Plateforme centrale de supervision et de gestion technique — architecture modulaire.

## Stack

| Couche | Technologie |
|--------|-------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, Recharts |
| Backend | NestJS 11, Prisma, PostgreSQL |
| Cache / Queue | Redis |
| Auth | JWT |
| Temps réel | Socket.IO |

## Démarrage rapide

### Prérequis

- Node.js 20+
- Docker Desktop (PostgreSQL + Redis)

### Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Démarrer PostgreSQL et Redis
docker compose up -d

# 3. Configurer l'environnement
cp .env.example apps/api/.env

# 4. Initialiser la base de données
npm run db:generate
npm run db:migrate
npm run db:seed

# 5. Lancer l'application
npm run dev
```

- **Frontend** : http://localhost:5173
- **API** : http://localhost:3000/api/v1

### Comptes de démo

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Owner | owner@lutron.local | owner123 |
| Utilisateur | tech@lutron.local | user123 |

## Architecture

```
LUTRON/
├── apps/
│   ├── api/          # API NestJS (Core + modules)
│   └── web/          # Interface React
├── packages/
│   └── shared/       # Types et permissions partagés
└── DOCS/             # Documentation fonctionnelle
```

### Modules Core V1

- **Monitoring** — vérifications HTTP/HTTPS/Ping, historique, scheduler
- **Alertes** — gestion et acquittement
- **Maintenances** — périodes planifiées
- **Documents** — documentation par service
- **Accès** — utilisateurs, rôles, permissions RBAC
- **Modules** — registre des modules installés

### API principale

Préfixe : `/api/v1`

| Endpoint | Description |
|----------|-------------|
| `POST /auth/login` | Authentification |
| `GET /services` | Liste des services |
| `GET /monitoring/resources` | Ressources supervisées |
| `GET /alerts` | Alertes |
| `GET /dashboard/stats` | Statistiques globales |
| `GET /documents` | Documentation |

## Interface

L'interface reprend le design de la maquette d'inspiration :

- Surface sombre flottante (95% × 90%)
- Sidebar fixe 280px avec navigation par groupes
- Structure répétée : Titre → Filtres → Carte principale → Graphiques
- Courbes violettes, barres de disponibilité, badges d'état
