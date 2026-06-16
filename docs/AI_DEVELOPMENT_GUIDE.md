# AI Development Guide — Future Pets

Conventions for AI agents (and human developers) building features in this repository.

---

## Required reading order

Before implementing any feature:

1. [README.md](../README.md) — project overview and current phase
2. [ROADMAP.md](ROADMAP.md) — find the current phase and acceptance criteria
3. [ARCHITECTURE.md](ARCHITECTURE.md) — Firestore schema, security, client vs server split
4. [GAME_DESIGN.md](GAME_DESIGN.md) — mechanics, stats, economy rules
5. [PET_ACQUISITION_AND_COLLECTION.md](PET_ACQUISITION_AND_COLLECTION.md) — Phase 8 multi-pet acquisition and collection UI

For Firebase provisioning tasks, also read [FIREBASE_SETUP.md](FIREBASE_SETUP.md).

---

## Golden rules

1. **One phase slice at a time** — do not jump ahead (e.g. no breeding code in Phase 1)
2. **Never roll rarity or stats on the client** — use Cloud Functions
3. **Balance values live in `src/lib/constants/game.ts`** — do not hardcode magic numbers in components
4. **Use shadcn/ui components first** — extend before building custom UI from scratch
5. **Use `@/` import alias** — e.g. `@/features/auth/SignInButton`
6. **No inline Firebase config** — read from env via `src/lib/firebase/config.ts` (Phase 1+)
7. **Match existing code style** — TypeScript strict, functional React components, Tailwind utilities
8. **Do not commit secrets** — `.env.local`, service account keys, or API secrets

---

## Project structure

```
src/
├── app/                      # Next.js routes only — thin page wrappers
├── components/
│   └── ui/                   # shadcn/ui — do not put feature logic here
├── features/
│   └── {feature}/
│       ├── components/       # Feature-specific UI
│       ├── hooks/            # Feature hooks
│       ├── types.ts          # Feature types
│       └── index.ts          # Public exports
└── lib/
    ├── constants/game.ts     # ALL tunable game balance
    ├── firebase/             # Firebase init (Phase 1+)
    └── utils.ts              # cn() helper
```

### Adding a new feature

Example: auth feature for Phase 1

```
src/features/auth/
├── components/
│   ├── AuthProvider.tsx
│   └── SignInButton.tsx
├── hooks/
│   └── useAuth.ts
├── types.ts
└── index.ts
```

Pages in `src/app/` should import from `@/features/auth`, not embed business logic.

---

## UI conventions

- **Theme:** Warm accent primary (orange/coral) — see `src/app/globals.css`
- **Components:** shadcn Button, Card, Badge, Progress (add via `npx shadcn@latest add ...`)
- **Layout:** Max width `max-w-6xl`, generous padding, rounded-2xl cards
- **Tone:** Teens/adults — avoid overly childish copy
- **Rarity badges:** common (gray), uncommon (green), rare (blue), shiny (gold), super (purple)

---

## Firebase conventions

### Client SDK (Phase 1+)

```typescript
// src/lib/firebase/config.ts
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  // ...
};

// src/lib/firebase/client.ts
// Initialize app, auth, firestore — singleton pattern
```

Use `"use client"` in components that call Firebase Auth/Firestore.

### Cloud Functions

- Place in `functions/src/`
- Callable functions for user-triggered actions (pet creation, rewards, trades)
- Scheduled functions for decay (Phase 2+)
- Import balance constants by duplicating critical values or sharing via copied constants file — do not import from Next.js src directly

### Security rules

- Update `firestore.rules` and `storage.rules` with each phase
- Deploy rules before testing: `npx -y firebase-tools@latest deploy --only firestore:rules,storage`
- Default deny; open minimum required paths

---

## Game logic conventions

### Stat changes

- Always clamp to `[STAT_MIN, STAT_MAX]` from `game.ts`
- Apply decay using `DECAY_PER_HOUR` and elapsed hours since `lastDecayAppliedAt`
- Care actions use `CARE_ACTIONS` cooldowns and deltas

### Pet creation

- Read species from `STARTER_SPECIES` (or adoption/mystery egg catalogs in Phase 8+)
- Roll rarity using `RARITY_WEIGHTS` (server-side)
- Apply `RARITY_STAT_MULTIPLIERS` and `ONBOARDING_STAT_BIAS` (starter only)
- Write result via `grantPet()` helper to `users/{uid}/pets/{petId}` (Phase 8+)
- Enforce `MAX_PETS` (5) on every acquisition path

### Economy

- Credits field on user doc
- Deduct credits in Cloud Function or Firestore transaction — not client-only
- No real-money IAP until Phase 7
- No real-money **pet** purchases ever — pets via credits, breeding, trades, gameplay (Phase 8+)

---

## Testing expectations

| Phase | Minimum testing |
|-------|-----------------|
| 0 | `npm run build` passes |
| 1 | Manual: sign in, create pet, view dashboard |
| 2 | Manual: care actions, decay after wait |
| 3 | Manual: shop purchase, public profile load |
| 4 | Manual: mini-game + reward claim |
| 5+ | Manual + consider Firestore rules unit tests |
| 8 | Manual: pet switcher, collection page, adoption, mystery egg hatch, drop pity |

Add automated tests when complexity warrants — do not add trivial tests.

---

## Prompt templates for common tasks

### Phase 1 auth

```
Implement Phase 1.1 for Future Pets:
- Add Firebase client init from .env.example vars
- Create src/features/auth with AuthProvider and Google SignInButton
- Wire sign-in on landing page CTA
- Follow docs/AI_DEVELOPMENT_GUIDE.md conventions
- Do not implement onboarding yet
```

### Phase 1 onboarding

```
Implement Phase 1.2 for Future Pets:
- Onboarding wizard: species picker (5 starters from game.ts), play style, element, personality
- Cloud Function createStarterPet with server-side rarity roll
- Route new users to /onboarding; completed users to /dashboard
- Update firestore.rules for users and pets
```

### Phase 2 care

```
Implement Phase 2 for Future Pets:
- Add feed/play/rest/heal to dashboard with CARE_ACTIONS cooldowns
- Apply passive decay on load using DECAY_PER_HOUR
- Persist stat updates to Firestore
```

### Phase 8 collection (8.1)

```
Implement Phase 8.1 for Future Pets:
- Add activePetId to user doc; refactor usePet() to resolve active pet (fallback: oldest)
- Pet switcher on dashboard header
- /collection page with Pets tab: roster grid, set active, cap indicator, empty-slot CTAs
- AppHeader: rename "My pet" to "Dashboard"; add "Collection" nav item
- Follow docs/PET_ACQUISITION_AND_COLLECTION.md
```

### Phase 8 grantPet + trades (8.2)

```
Implement Phase 8.2 for Future Pets:
- Extract grantPet() helper in functions/src/grantPet.ts
- Refactor createStarterPet and hatchEgg to use grantPet()
- Add acquiredVia on pet docs; rename BREEDING_MAX_PETS to MAX_PETS
- Enforce MAX_PETS on trade receive; remove single-pet swap guard
- Add pet picker to trade UI for multi-pet accounts
```

### Phase 8 shop adoption (8.3)

```
Implement Phase 8.3 for Future Pets:
- Add ADOPTION_OFFERS and MYSTERY_EGG constants to game.ts
- Shop tabs: Adopt, Eggs (keep Cosmetics and Premium IAP)
- Callables: adoptPet, hatchMysteryEgg; extend purchaseItem for mystery-egg
- Collection Items tab: eggs section with hatch flow
```

### Phase 8 mini-game drops (8.4)

```
Implement Phase 8.4 for Future Pets:
- Pet capsule drop table in claimMiniGameReward (rate, pity, daily cap)
- petCapsulePityCounter on user doc
- Callable hatchPetCapsule; Collection capsules UI
- Analytics: pet_capsule_dropped, pet_capsule_hatched
```

### Phase 8 daily login + achievements (8.5)

```
Implement Phase 8.5 for Future Pets:
- DAILY_LOGIN_REWARDS table and claimDailyLogin callable
- users/{uid}/achievements subcollection and checkAchievements callable
- craftMysteryEgg callable (5 egg-fragment → 1 mystery-egg)
- Collection Items tab: materials and fragments sections
```

---

## Files you should NOT modify without reason

- `components.json` — shadcn config
- `next.config.ts` — only change for static export or App Hosting when deploying
- Plan files in `.cursor/plans/` — user-owned

---

## Commit message style

Use concise, purpose-driven messages:

- `feat(auth): add Google Sign-In with AuthProvider`
- `feat(pets): add createStarterPet Cloud Function`
- `docs: expand breeding inheritance rules`

---

## When stuck

1. Re-read acceptance criteria in ROADMAP for the current phase
2. Check ARCHITECTURE for whether logic belongs client-side or in Cloud Functions
3. Check GAME_DESIGN for intended player experience
4. Prefer smallest correct diff — do not over-engineer

---

## Related documents

- [ROADMAP.md](ROADMAP.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [GAME_DESIGN.md](GAME_DESIGN.md)
- [PET_ACQUISITION_AND_COLLECTION.md](PET_ACQUISITION_AND_COLLECTION.md)
- [FIREBASE_SETUP.md](FIREBASE_SETUP.md)
