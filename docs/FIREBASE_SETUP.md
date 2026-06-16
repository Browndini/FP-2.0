# Firebase Setup — Future Pets

Step-by-step guide to create and configure your Firebase project. **You create the project yourself** — this repo ships with stubs and documentation only until Phase 1.

---

## Prerequisites

- Google account
- Node.js 20+
- Firebase CLI (via npx — no global install required)

---

## 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project**
3. Name it (e.g. `Future Pets` or `future-pets-prod`)
4. Note the **Project ID** (lowercase, e.g. `future-pets-prod-abc123`)
5. Enable or skip Google Analytics (optional for MVP)

---

## 2. Register a web app

1. In Project Overview, click **Web** (`</>`)
2. Register app nickname: `Future Pets Web`
3. Copy the `firebaseConfig` object values
4. Paste into `.env.local` (create from `.env.example`):

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

Never commit `.env.local`.

---

## 3. Enable Google Sign-In

### Option A: Firebase Console

1. **Build → Authentication → Sign-in method**
2. Enable **Google**
3. Set support email and project public name: `Future Pets`
4. Save

### Option B: firebase.json + CLI deploy

This repo includes an auth block in [`firebase.json`](../firebase.json). Update `supportEmail`, then:

```bash
npx -y firebase-tools@latest login
npx -y firebase-tools@latest use your-project-id
npx -y firebase-tools@latest deploy --only auth
```

### Authorized domains

Add these under **Authentication → Settings → Authorized domains**:

- `localhost` (no protocol or port)
- Your production domain when deployed

If Google Sign-In popup closes immediately with `[firebase_auth/unauthorized-domain]`, the current domain is missing from this list.

---

## 4. Create Firestore database

1. **Build → Firestore Database → Create database**
2. Choose **Production mode** (rules stub denies all until Phase 1)
3. Select a region close to your users (e.g. `us-central1`)

Deploy rules from this repo when ready:

```bash
npx -y firebase-tools@latest deploy --only firestore:rules
```

Rules file: [`firestore.rules`](../firestore.rules) — currently deny-all. Phase 1 opens user/pet paths per [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 5. Enable Firebase Storage

1. **Build → Storage → Get started**
2. Use default bucket
3. Deploy storage rules:

```bash
npx -y firebase-tools@latest deploy --only storage
```

Rules file: [`storage.rules`](../storage.rules) — currently deny-all.

---

## 6. Link local project to Firebase

Update [`.firebaserc`](../.firebaserc):

```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

Verify:

```bash
npx -y firebase-tools@latest use
# Should show: Active Project: your-project-id
```

---

## 7. Enable billing (required for Cloud Functions)

Phase 1+ uses Cloud Functions for server-side pet stat rolls.

1. **Project Settings → Usage and billing**
2. Upgrade to **Blaze (pay as you go)** plan
3. Set budget alerts (recommended)

Cloud Functions free tier covers early development; monitor usage in console.

---

## 8. Cloud Functions setup (Phase 1+)

When implementing Phase 1:

```bash
npx -y firebase-tools@latest init functions
# Choose TypeScript, ESLint, install dependencies
```

Implement `createStarterPet` callable function. Deploy:

```bash
npx -y firebase-tools@latest deploy --only functions
```

---

## 9. Seed species catalog (Phase 1+)

Create documents in `species/{speciesId}` matching [`src/lib/constants/game.ts`](../src/lib/constants/game.ts) `STARTER_SPECIES`, or use a seed script / Cloud Function on first deploy.

---

## 10. Deploy hosting (when ready)

### Static export (Phase 0 — current)

Static export is configured in [`next.config.ts`](../next.config.ts):

```typescript
const nextConfig: NextConfig = {
  output: "export",
};
```

Build output goes to `out/`, which Firebase Hosting serves per [`firebase.json`](../firebase.json).

**Deploy (one command):**

```bash
npm run deploy:hosting
```

Or step by step:

```bash
npm run build
npx -y firebase-tools@latest deploy --only hosting
```

**Live site (Future Pets project):**

| URL | Purpose |
|-----|---------|
| https://future-pets-3.web.app | Primary hosting URL |
| https://future-pets-3.firebaseapp.com | Alternate Firebase URL |

Ensure `.firebaserc` points at your project ID:

```json
{
  "projects": {
    "default": "future-pets-3"
  }
}
```

After Phase 1 adds auth, add `future-pets-3.web.app` and `future-pets-3.firebaseapp.com` to **Authentication → Settings → Authorized domains**.

### Deploy Firestore and Storage rules

Before opening any client access in later phases, deploy the deny-by-default rules:

```bash
npm run deploy:rules
```

### Firebase App Hosting (Phase 1+ — SSR)

Use App Hosting when you need Server-Side Rendering, protected routes, or dynamic `/dashboard` pages. Classic Hosting + static export is sufficient for Phase 0.

**Requirements:**

- Blaze (pay-as-you-go) plan
- Remove `output: "export"` from `next.config.ts` when switching

**Setup:**

1. Add an `apphosting` block to `firebase.json` (see commented example below).
2. Configure [`apphosting.yaml`](../apphosting.yaml) with env vars and secrets.
3. Set secrets (do not commit values):

   ```bash
   npx -y firebase-tools@latest apphosting:secrets:set FIREBASE_API_KEY
   npx -y firebase-tools@latest apphosting:secrets:set FIREBASE_APP_ID
   npx -y firebase-tools@latest apphosting:secrets:grantaccess
   ```

4. Deploy:

   ```bash
   npx -y firebase-tools@latest deploy --only apphosting
   ```

**Optional — GitHub CI/CD:** Connect your repo in the Firebase Console under App Hosting for push-to-deploy. See [Firebase App Hosting docs](https://firebase.google.com/docs/app-hosting).

**`firebase.json` apphosting block (enable in Phase 1+):**

```json
"apphosting": {
  "backendId": "future-pets-web",
  "rootDir": "/",
  "ignore": ["node_modules", ".git", "firebase-debug.log", "firebase-debug.*.log", "functions"]
}
```

See [ARCHITECTURE.md](ARCHITECTURE.md) deployment section.

---

## Stripe IAP (Phase 7)

Premium cosmetics use **Stripe Checkout** — cosmetic items only, no stat or credit grants.

### Product IDs

| Item ID | Name | Stripe env var |
|---------|------|----------------|
| `iap-nebula-cape` | Nebula Cape | `STRIPE_PRICE_NEBULA_CAPE` |
| `iap-aurora-halo` | Aurora Halo | `STRIPE_PRICE_AURORA_HALO` |
| `iap-celestial-wings` | Celestial Wings | `STRIPE_PRICE_CELESTIAL_WINGS` |

Create matching Products/Prices in the [Stripe Dashboard](https://dashboard.stripe.com/products) (test mode first).

### Cloud Functions secrets

```bash
npx -y firebase-tools@latest functions:secrets:set STRIPE_SECRET_KEY
npx -y firebase-tools@latest functions:secrets:set STRIPE_WEBHOOK_SECRET
npx -y firebase-tools@latest functions:secrets:set STRIPE_PRICE_NEBULA_CAPE
npx -y firebase-tools@latest functions:secrets:set STRIPE_PRICE_AURORA_HALO
npx -y firebase-tools@latest functions:secrets:set STRIPE_PRICE_CELESTIAL_WINGS
```

Redeploy functions after setting secrets: `npm run deploy:all`

### Stripe webhook

Point Stripe webhook to:

```
https://us-central1-future-pets-3.cloudfunctions.net/stripeWebhook
```

Event: `checkout.session.completed`

Clients also call `verifyIapPurchase` on return from Checkout as a fallback.

### Analytics

Firebase Analytics events: `sign_up`, `pet_created`, `mini_game_completed`, `shop_purchase`, `iap_checkout_started`, `iap_purchase_completed`, `app_error`.

Enable Google Analytics for your Firebase project in the Firebase Console if events do not appear.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `auth/unauthorized-domain` | Add domain to Authorized domains (no `http://` or port). Include `localhost`, `future-pets-3.web.app`, and `future-pets-3.firebaseapp.com` after deploy. |
| Firestore permission denied | Run `npm run deploy:rules`; ensure user is authenticated; verify rules match [ARCHITECTURE.md](ARCHITECTURE.md). |
| Env vars undefined | Restart `npm run dev` after editing `.env.local`. For Hosting, env vars are baked in at **build time** — rebuild and redeploy. |
| Functions deploy fails | Enable billing (Blaze plan); check Node version matches functions runtime. |
| Hosting deploy shows 0 files | Run `npm run build` first; confirm `out/` exists and `firebase.json` `"public"` is `"out"`. |
| Blank page after deploy | Check browser console; ensure static assets under `_next/` uploaded (52 files expected for Phase 0). |
| `next start` fails after export | Static export has no Node server — use `npx serve out` locally or rely on Firebase Hosting. |

---

## Security checklist before launch

- [x] Firestore rules deny-by-default (`firestore.rules` — deploy with `npm run deploy:rules`)
- [x] Storage rules deny-by-default (`storage.rules` — deploy with `npm run deploy:rules`)
- [x] No admin SDK keys in client code or git
- [x] `.env.local` in `.gitignore` (never commit Firebase config secrets)
- [ ] Stat rolls and economy mutations only via Cloud Functions (Phase 1+)
- [ ] Budget alerts enabled on Firebase project ([Usage and billing](https://console.firebase.google.com/project/future-pets-3/usage))
- [ ] Production authorized domains configured in Firebase Auth (Phase 1+)
- [ ] `supportEmail` in `firebase.json` auth block updated from placeholder before enabling Google Sign-In deploy

---

## Related documents

- [ARCHITECTURE.md](ARCHITECTURE.md) — schema and rules design
- [ROADMAP.md](ROADMAP.md) — when to wire each Firebase feature
- [README.md](../README.md) — local dev quick start
