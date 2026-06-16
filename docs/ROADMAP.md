# Roadmap — Future Pets

Phased build plan with acceptance criteria, likely files, Firebase changes, and AI prompt templates.

**Current phase: 3**

---

## Phase 0 — Foundation

**Goal:** Runnable app, landing page, documentation, and project conventions.

### Deliverables

- Next.js + TypeScript + Tailwind + shadcn/ui scaffold
- Landing page (hero, feature cards, Phase 1 CTA placeholder)
- `src/lib/constants/game.ts` with tunable balance values
- Placeholder pet SVGs for 5 starter species
- Firebase config stubs (rules deny-all until Phase 1)
- Full documentation suite

### Acceptance criteria

- [x] `npm run dev` serves landing page at localhost:3000
- [x] `npm run build` passes
- [x] README + 5 docs files exist with substantive content
- [x] No Firebase secrets committed

### AI prompt template

> Implement Phase 0 for Future Pets: scaffold Next.js App Router with TypeScript, Tailwind, shadcn/ui, a landing page, game constants stub, placeholder pet assets, Firebase stubs, and the full docs suite per README and plan.

---

## Phase 1 — Account + pet

**Goal:** Google Sign-In, onboarding, server-side starter pet roll, pet dashboard.

### Deliverables

1. Firebase SDK init (`src/lib/firebase/client.ts`)
2. Google Sign-In button + auth context (`src/features/auth/`)
3. Onboarding wizard: species pick + 3 choice groups (`src/features/onboarding/`)
4. Cloud Function `createStarterPet` — rarity + stat roll
5. Pet dashboard showing stats, rarity, species image (`src/features/dashboard/`)
6. Firestore rules: users + pets read/write own data
7. Deploy auth config (`firebase deploy --only auth`)

### Likely files

```
src/features/auth/
  AuthProvider.tsx
  SignInButton.tsx
  useAuth.ts
src/features/onboarding/
  OnboardingWizard.tsx
  SpeciesPicker.tsx
src/features/pets/
  types.ts
  usePet.ts
src/features/dashboard/
  PetDashboard.tsx
  StatBar.tsx
src/app/dashboard/page.tsx
src/app/onboarding/page.tsx
functions/src/createStarterPet.ts
```

### Firebase changes

- Enable Google Auth
- Firestore `users`, `users/{uid}/pets`, `species` collections
- Callable Function for pet creation
- Update `firestore.rules` for Phase 1

### Acceptance criteria

- [x] User can sign in with Google
- [x] New user completes onboarding and receives one pet
- [x] Pet stats reflect species, onboarding choices, and rarity roll
- [x] Rarity roll happens server-side only (createStarterPet Cloud Function)
- [x] Dashboard displays all 8 stats + level/XP
- [x] User cannot create a second starter pet without admin override

### AI prompt template

> Implement Phase 1.1: Add Firebase client SDK initialization using env vars from .env.example, create AuthProvider and Google SignInButton, replace the disabled landing CTA with working sign-in. Follow docs/AI_DEVELOPMENT_GUIDE.md.

> Implement Phase 1.2: Build onboarding wizard (species + play style + element + personality), Cloud Function createStarterPet with rarity roll from game.ts constants, and route new users to /onboarding before /dashboard.

> Implement Phase 1.3: Build pet dashboard at /dashboard showing pet image, name, rarity badge, and all stats with shadcn progress bars.

---

## Phase 2 — Care loop

**Goal:** Feed/play/rest/heal actions, stat decay, cooldowns.

### Deliverables

- Care action buttons with cooldown timers
- Decay applied on dashboard load (`lastDecayAppliedAt`)
- Firestore updates for stat changes
- Low-stat warnings (hunger/happiness at 0)
- Pet rename (one free rename)

### Firebase changes

- Optional scheduled Function `applyStatDecay` (hourly)
- Index on `users/{uid}/pets` if querying multiple pets

### Acceptance criteria

- [x] Each care action updates stats and enforces cooldown
- [x] Decay applies correctly based on elapsed time
- [x] Heal deducts credits
- [x] Stats clamped to 0–100

### AI prompt template

> Implement Phase 2: Add care actions (feed, play, rest, heal) to the pet dashboard with cooldowns from game.ts CARE_ACTIONS, apply passive decay on load using DECAY_PER_HOUR, and persist updates to Firestore.

---

## Phase 3 — Economy + social

**Goal:** Credits, cosmetic shop, public profiles, visit pages.

### Deliverables

- Credits balance on user doc (starting 500)
- Shop UI with cosmetic items (seed `items` collection)
- Inventory subcollection
- Username selection (unique index)
- Public profile route `/u/[username]/pet/[petId]`
- Visit other players (read-only)

### Firebase changes

- `items`, `users/{uid}/inventory`, `usernames/{username}`
- Security rules for public profile reads
- Storage for purchased cosmetic assets

### Acceptance criteria

- [x] User can spend credits in shop
- [x] Cosmetics equip on pet (visual placeholder OK)
- [x] Public URL shows pet without auth
- [x] Usernames unique and validated

### AI prompt template

> Implement Phase 3.1: Add credits balance, shop page with 5 seed cosmetic items, purchase flow writing to inventory, and equip cosmetic on pet dashboard.

> Implement Phase 3.2: Add username setup, public pet profile page at /u/[username]/pet/[petId], and Firestore rules for public read of pet profile fields.

---

## Phase 4 — Mini-games

**Goal:** 1–2 playable mini-games with server-validated rewards.

### Deliverables

- Mini-game hub page
- `reflex-dash` (speed) and `memory-match` (intelligence) — start with 2
- game should be built using Phaserjs | Docs: (https://phaser.io/tools/phaser-docs)
- if possible maybe have a live connection to the database to counteract frontend manipulation
- Session tracking in `miniGameSessions`
- Callable Function `claimMiniGameReward`
- XP + credits granted on completion

### Acceptance criteria

- [ ] Games playable in browser
- [ ] Rewards only granted via Cloud Function after score validation
- [ ] Skill stats and XP update on pet doc
- [ ] Energy cost to play (optional — TUNABLE)

### AI prompt template

> Implement Phase 4: Add mini-game hub with reflex-dash and memory-match games, write sessions to Firestore, and Cloud Function claimMiniGameReward that validates score and grants XP/credits/skill stats per GAME_DESIGN.md.

---

## Phase 5 — Trading

**Goal:** Player-to-player item/credits trading with escrow.

### Deliverables

- Trade offer UI (create, accept, cancel)
- `trades/{tradeId}` collection
- Cloud Function `executeTrade` with atomic swap
- Trade history log
- New account trade cooldown (7 days)

### Acceptance criteria

- [ ] Items locked in escrow during pending trade
- [ ] Atomic swap on accept; no duplication exploits
- [ ] Trade history visible to both parties
- [ ] Pets not tradable (cosmetics/consumables/credits only)

### AI prompt template

> Implement Phase 5: Add trade offer system for items and credits with escrow via Cloud Function executeTrade, trade cooldown for new accounts, and trade history UI.

---

## Phase 6 — Breeding

**Goal:** Match pets, incubate eggs, hatch offspring.

### Deliverables

- Breeding match UI (invite partner pet)
- Compatibility checks (level, cooldown)
- `breedingPairs/{pairId}` + egg inventory item
- Hatch Cloud Function with inheritance algorithm from GAME_DESIGN.md
- Shiny parent bonus on offspring roll

### Acceptance criteria

- [ ] Two players can initiate breeding pair
- [ ] Egg incubates over real time
- [ ] Hatch creates new pet with inherited stats + rarity roll
- [ ] Breeding cooldown enforced per pet

### AI prompt template

> Implement Phase 6: Add breeding match flow, egg incubation timer, hatch Cloud Function using inheritance rules in GAME_DESIGN.md, and offspring pet creation.

---

## Phase 7 — Polish + IAP

**Goal:** Production readiness, cosmetic IAP, analytics, deploy.

### Deliverables

- Firebase App Hosting production deploy
- Cosmetic IAP integration (Stripe or platform-native — TBD)
- Analytics events (sign-up, pet created, mini-game played, purchase)
- Error monitoring
- Performance pass on dashboard and games
- Shiny/super visual treatments

### Acceptance criteria

- [ ] Production URL live on Firebase
- [ ] IAP purchases grant cosmetic items only
- [ ] Core flows monitored with analytics
- [ ] No pay-to-win paths in shop or IAP

### AI prompt template

> Implement Phase 7.1: Configure Firebase App Hosting deploy for Next.js, add production env setup docs, and deploy staging environment.

> Implement Phase 7.2: Add cosmetic IAP flow (document product IDs), analytics events for key funnel steps, and shiny/super visual badges on pet dashboard.

---

## Phase dependency graph

```mermaid
flowchart LR
  P0[Phase 0 Foundation] --> P1[Phase 1 Account]
  P1 --> P2[Phase 2 Care]
  P2 --> P3[Phase 3 Economy]
  P3 --> P4[Phase 4 Mini-games]
  P3 --> P5[Phase 5 Trading]
  P4 --> P6[Phase 6 Breeding]
  P5 --> P6
  P6 --> P7[Phase 7 Polish]
```

---

## Updating this roadmap

When a phase completes:

1. Check off acceptance criteria in this file and README.md
2. Update "Current phase" header
3. Log any scope changes in GAME_DESIGN.md open decisions
