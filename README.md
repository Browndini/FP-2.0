# Future Pets

**Future Pets** is a Neopets-inspired, long-term pet progression game. Players create an account, choose onboarding preferences, roll a starter companion with unique stats (including rare shiny and super variants), and build their pet over weeks and months through care actions, mini-games, social visits, trading, and eventually breeding.

Target audience: **teens and adults**. Monetization plan: **cosmetic IAP only** — no pay-to-win.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | [Next.js](https://nextjs.org/) (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, [shadcn/ui](https://ui.shadcn.com/) |
| Backend | Firebase (Auth, Firestore, Storage, Cloud Functions) |
| Auth | Google Sign-In via Firebase Authentication |
| Hosting | Firebase Hosting / Firebase App Hosting (see [ARCHITECTURE.md](docs/ARCHITECTURE.md)) |

---

## Quick start

### Prerequisites

- Node.js 20+
- npm
- A Firebase project (you create this yourself — see [FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md))

### Run locally

```bash
npm install
cp .env.example .env.local   # fill in Firebase web config
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Deploy (Firebase Hosting)

```bash
npm run deploy:hosting
```

Live site: [https://future-pets-3.web.app](https://future-pets-3.web.app)

See [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md) for full Firebase setup and App Hosting (Phase 1+).

### Build

```bash
npm run build
```

Static export output is written to `out/` for Firebase Hosting. `npm start` is not used with static export.

---

## Documentation

| Document | Purpose |
|----------|---------|
| [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md) | Game mechanics, stats, economy, breeding, trading |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, Firestore schema, security, deployment |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Phased build plan with acceptance criteria |
| [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md) | Step-by-step Firebase project setup |
| [docs/AI_DEVELOPMENT_GUIDE.md](docs/AI_DEVELOPMENT_GUIDE.md) | Conventions for AI agents building features |

---

## Current phase status

### Phase 0 — Foundation (complete)

- [x] Next.js + TypeScript + Tailwind + shadcn/ui scaffold
- [x] Landing page with hero and feature overview
- [x] Game constants stub (`src/lib/constants/game.ts`)
- [x] Placeholder pet assets (`public/pets/placeholders/`)
- [x] Firebase config stubs (`firebase.json`, rules files)
- [x] Documentation suite

### Phase 1 — Account + pet (current)

- [x] Firebase SDK initialization
- [x] Google Sign-In (`src/features/auth/`)
- [x] Onboarding flow — species picker + 3 choice groups (`src/features/onboarding/`)
- [x] Server-side pet stat roll (`functions/src/createStarterPet.ts`)
- [x] Pet dashboard with all 8 stats + level/XP (`src/features/dashboard/`)

See [docs/ROADMAP.md](docs/ROADMAP.md) for Phases 2–7.

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in values from the Firebase Console. All variables are prefixed with `NEXT_PUBLIC_` because they are used by the client-side Firebase SDK.

Never commit `.env.local`. See [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md).

---

## Project structure

```
FP-2.0/
├── docs/                    # Design, architecture, roadmap, AI guide
├── public/
│   └── pets/placeholders/   # Starter species placeholder SVGs
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/ui/       # shadcn/ui components
│   ├── features/            # Feature modules (Phase 1+)
│   └── lib/
│       ├── constants/       # Tunable game balance (game.ts)
│       └── utils.ts         # shadcn cn() helper
├── firebase.json            # Firebase project config
├── firestore.rules          # Firestore security rules (stub)
├── storage.rules            # Storage security rules (stub)
└── .env.example             # Environment variable template
```

Feature code should live under `src/features/{feature}/` (auth, pets, dashboard, etc.). See [docs/AI_DEVELOPMENT_GUIDE.md](docs/AI_DEVELOPMENT_GUIDE.md).

---

## How to build the next feature with AI

1. Read [docs/ROADMAP.md](docs/ROADMAP.md) and identify the current phase slice.
2. Point the AI agent at [docs/AI_DEVELOPMENT_GUIDE.md](docs/AI_DEVELOPMENT_GUIDE.md).
3. Use a prompt like: *"Implement Phase 1.1: Firebase SDK init and Google Sign-In button on the landing page. Follow AI_DEVELOPMENT_GUIDE conventions."*

---

## License

Private project — all rights reserved.
