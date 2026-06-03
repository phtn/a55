# PROJECT-INDEX.md

**Project:** ftsb (internal) / "Stake Street" / "stake.st" / "36*stake*St" / "Stake St"  
**Version:** 0.1.2 (package.json); v0.10 (UI footer)  
**Indexed:** 2026 (via explore subagent + direct analysis)  
**Tagline (inferred):** "Fund, Transfer, Stake and Bet"

This document provides a comprehensive map of the codebase for developers and AI agents. It was generated through systematic exploration of source, schema, UI flows, and configuration.

---

## 1. High-Level Purpose & Value Proposition

A personal dashboard platform combining:
- **Crypto-powered "stake" purchases** — Tiered products named after poker/gambling personalities (Dana White, Mikki Mase, Phil Ivey) at $15/$30/$70 levels. Purchasing via on-chain payment materializes a `stake` record that contributes to the user's "Stake Value".
- **Ledger & history tracking** — Real-time balance via Convex (stakes + immutable txns + history snapshots for charts).
- **Advanced roulette / betting UI** ("Bets") — Custom "KIMS ALGO" quadrant-based strategy interface with profit tracking; external result ingestion endpoints.
- **Stock & market discovery** — Deep Yahoo Finance integration (quotes, charts, fundamentals, screeners) + AI (Grok/Cohere) insights on company pages.
- **Full crypto wallet surface** — Reown AppKit (EVM + native Bitcoin) for connect, pay, send, receive, swap. User-managed address books (`user_crypto_wallets`, contacts).
- **Admin tooling** — Monitoring of users/stakes/bets + configuration of crypto relays (privileged hot wallets for platform flows).

**Tone:** Gambling-adjacent + financial (high-risk language in UI, poker personas for tiers, "Activate Bets", "Win Daily").

**Primary user journey:** Google sign-in (Firebase) → Account created in Convex → Dashboard (/x) showing Stake Value + option to buy first stake via crypto → Access to Bets, Explore (stocks), Markets.

---

## 2. Tech Stack

- **Frontend**: Next.js 16.2.6 (Turbo), React 19.2.6 (React Compiler), TypeScript 5, Tailwind 4 (`@tailwindcss/postcss` + postinstall patch).
- **Backend**: Convex 1.39.1 (real-time DB + functions). Firebase 12/13 (Auth + Admin) for identity + custom claims.
- **Crypto**: Reown AppKit 1.8 (Wagmi + Bitcoin adapters), Wagmi 3.6, viem (relays), bitcoin libs (ecpair, tiny-secp256k1), ethers.
- **Data/Finance**: yahoo-finance2 (proxied), recharts not used — custom `evilcharts`.
- **AI/UX**: @ai-sdk/cohere + `ai`, LMNT TTS, GSAP + ScrollTrigger, motion, three-px-react (pixel effects), custom split-flap/scramble/hyperlist UI primitives.
- **State/URL**: nuqs (heavy in pay flows and dashboard tabs), TanStack Query, Convex React.
- **Other**: canvas-confetti, qrcode, radix, base-ui, class-variance-authority, hugeicons.
- **Auth flow**: Firebase Google OAuth → ID token → Convex customJwt (RS256, tx-hash project) + HTTP-only session cookie (`stake-street-session`).
- **Deployment notes**: Bun-friendly scripts; Node runtime for yf2/relay/auth APIs; PWA manifest ("Stake Street").

---

## 3. Authentication & Identity Model

- **Primary identity**: Firebase User (Google). `sub` (subject) is the stable key.
- **Convex users**: Synced from Firebase identity (`tokenIdentifier = `${issuer}|${subject}``). Stores profile fields + timestamps.
- **Accounts**: 1-per-sub (Firebase subject). Holds `title`, denormalized `stakes[]` array of Ids, links to ledger tables.
- **Session**: Server verifies Firebase ID token → upserts user + account (with seed history) → sets 5-day cookie. Client uses `getIdToken()` for Convex auth.
- **Admin**: Gated by Firebase custom claim `admin: true`. Subdomain handoff support (`/admin` or admin subdomain).
- **Seams**: Firebase (identity provider) → session cookie + Convex JWT + explicit sync mutations.

Key files: `lib/firebase/*`, `convex/auth.config.ts`, `app/api/auth/session/route.ts`, `ctx/convex/client.tsx`.

---

## 4. Core Domain Entities (Convex)

All tables include `createdAt` / `updatedAt` (epoch ms). Heavy indexing.

| Table                    | Key Fields / Purpose                                                                 | Relationships |
|--------------------------|--------------------------------------------------------------------------------------|---------------|
| `users`                  | tokenIdentifier, subject, issuer, name/email/picture, emailVerified                 | 1 user : 1 account (via sub) |
| `accounts`               | sub, tokenIdentifier, title, stakes: Id<'stakes'>[]                                 | Owns stakes, history, txns |
| `stakes`                 | accountId, userId, amount, title (e.g. "Phil Ivey"), level (1-3), isStaked, isActive | Materialized from orders |
| `orders`                 | refNumber (ORD-...), status, totalCents, product details, payment:{status, asset, chain, values}, stakeId | Pending → confirm creates stake + ledger |
| `txns`                   | userId, accountId, amount, title, description, status ('posted')                    | Ledger lines (immutable) |
| `history`                | userId, accountId, amount, type ('seed'/'order_completed'), change/changePct, summary | Balance snapshots for charts |
| `user_crypto_wallets`    | userId + networkKey + normalizedAddress, walletType, assets[], isPrimary, tags, source | Rich address book + asset tracking |
| `contacts` + `contact_wallet_addresses` | name/email/notes + labeled addresses per network | Sending targets |
| `transactions`           | network, address, amount, contact/wallet refs, note                               | Outbound send records |
| `admin`                  | identifier + {type, data: {key,value}} KV                                           | Platform config (relay wallets/creds) |

**Business invariant**: Successful `confirmOrderPayment` atomically creates `stake` + `txn` + `history` entry + patches `account.stakes` + marks order completed.

See: `convex/schema.ts`, individual `/d.ts`, `orders/m.ts` (the heart of value creation).

---

## 5. Directory Structure & Key Modules

```
app/
  (site)/
    page.tsx                 # Hero / splash with split-flap "36*stake*St"
    x/                       # Main SPA-like dashboard (catch-all [page])
      content.tsx            # Orchestrates balance, stakes, products, txns
      [page]/                # bets-page, stakes-page, explore, markets...
    company/[symbol]/        # Deep stock pages (quotes, evilcharts, Grok)
  (admin)/                   # Protected (custom claims + session)
    admin/                   # users, stakes, roulette analytics, configs/crypto-wallets
    layout.tsx               # requireAdminSession
  api/
    auth/                    # session, admin-handoff, client-token
    bets/r1|r2               # Roulette result ingestion (CORS)
    yf2                      # Yahoo Finance proxy (many ops, detailed README)
    relay/*                  # Privileged on-chain (viem + admin keys from Convex)
    grok, tts, exchange-rate, quotes, accounts

convex/
  schema.ts                  # Aggregates all domain d.ts + indexes
  users/ accounts/ stakes/ orders/ txns/ history/ ... (each: d.ts + q.ts + m.ts as needed)
  auth.config.ts             # Firebase customJwt

components/
  product/                   # ProductList (tiers), ProductCard, Pay flow, network/token selects
  lib/appkit/                # Large self-contained crypto wallet layer (pay, send, receive, swap, selectors, hooks, nuqs state)
  ui/                        # Primitives (button, card, input, tabs...)
  evilcharts/                # Custom chart primitives
  bets/, cards/stock.tsx, hero.tsx, app-shell.tsx, sidebar.tsx, topbar.tsx (global wallet), ...

lib/
  appkit/                    # (see above) — one of the deepest modules
  firebase/                  # Split client/server auth + claims + sessions
  roulette/                  # KIMS_ALGO constants + types
  yf2/                       # Yahoo wrapper + excellent README
  admin/crypto-wallet-settings.ts  # Typed relay config (de)serializer
  fees/processing.ts         # Order fee math
  icons/ (large system), helpers/, tokens/, grokipedia.ts, explore-data.ts, markets-data.ts

ctx/
  convex/, wagmi/            # Providers (auth-aware Convex + AppKit/Wagmi + QueryClient)

hooks/
  use-*.ts (crypto balances, pay state, exchange rates, firebase-convex-auth, toggle, api, copy...)

types/
  bets.ts (rich BetResult), dashboard.ts (Page union)
```

**Notable patterns**:
- Convex: strict domain folders with `d.ts` (validators + types), `q.ts`, `m.ts`.
- Heavy `nuqs` for URL-driven complex state (pay flows, dashboard tabs).
- Route groups for auth isolation.
- "Wallet OS" in `lib/appkit/` — reusable across product checkout and global topbar.
- Proxy APIs for external services (Yahoo, relays, bets ingest).

---

## 6. Key Features & Flows

1. **Stake Purchase Flow** (core value creation)
   - ProductList → select tier → NetworkSelect + TokenSelect (via `useProductPaymentSelection`)
   - Create pending `order` (with PHP pricing + fee math)
   - AppKit pay modal (multi-chain support, exchange rates)
   - On-chain success → `confirmOrderPayment` mutation → stake + ledger materialized

2. **Dashboard (/x)**
   - Account title (editable, typewriter on load)
   - Stake Value = sum of active stakes
   - History area chart (evilcharts)
   - Recent txns
   - Stakes list (hyperlist)
   - Product upsell when zero stakes

3. **Bets / Roulette**
   - Sophisticated client UI with board quadrants, KIMS algo, virtual spins, profit/pct tracking
   - `/api/bets/r1` and `r2` for ingesting external lobby histories / results (used by admin analytics)

4. **Stocks**
   - `/api/yf2` supports 12+ Yahoo operations (quote, chart, fundamentalsTimeSeries, screener, insights...)
   - Company pages with live data, charts, Grok-generated profiles

5. **Crypto Wallet**
   - Global AppKit modal (topbar)
   - Rich pay/send/receive/swap surfaces + balance hooks (USDC, BTC)
   - Persistent user_crypto_wallets + contacts (partially wired)

6. **Admin**
   - Analytics for roulette ingest
   - Crypto wallet/relay config (persisted in `admin` KV table, consumed by relay routes)

---

## 7. Most Important Files (Curated)

(See the full subagent output for the complete numbered list with descriptions.)

Critical ones:
- `convex/orders/m.ts` — Business heart: order creation + payment confirmation side-effects
- `components/product/product-list.tsx` — Defines the three purchasable stake tiers
- `convex/schema.ts` + all `*/d.ts` — Data model
- `lib/appkit/pay.tsx` + related — Crypto payment execution
- `app/(site)/x/content.tsx` — Main dashboard composition
- `lib/firebase/server-session.ts` + `app/api/auth/session/route.ts` — Auth seam
- `ctx/wagmi/index.tsx` — AppKit + Wagmi setup
- `app/api/yf2/route.ts` + `lib/yf2/` — Finance data backbone
- `lib/admin/crypto-wallet-settings.ts` — Admin relay config

---

## 8. Architectural Observations (from indexing)

**Deep / strong areas**:
- End-to-end transactional stake purchase flow (order → onchain → confirm → multi-table write).
- Ledger design (txns + history snapshots) for historical balance views.
- `lib/appkit/` as a cohesive wallet module.
- yf2 proxy with excellent self-documentation.
- Convex domain organization.

**Areas of coupling / friction**:
- Order/stake/history/txn writes are tightly coordinated in one mutation (good locality, but large surface).
- Firebase identity mapping logic appears in a few places.
- Pay flow state scattered across product components + lib/appkit + nuqs (powerful but complex).
- Relay private keys live in Convex admin table (high privilege surface).
- Some tables (contacts, transactions, user_crypto_wallets) have rich schema but lighter UI wiring currently.

**Shallow / WIP signals**:
- `isStaked` / `isActive` flags on stakes not heavily exercised in visible code.
- Admin surfaces are largely read-only dashboards.
- Full send-to-contact wallet flows exist in components/hooks but not primary user paths yet.
- Hardcoded products, some fee logic, PHP currency choice (vs USD/crypto everywhere else).

---

## 9. Open Questions (from explorer)

- Exact semantics of a "stake" in the business model? (poker staking for the named pros? tiered membership? something else?)
- Relationship between the roulette "Bets" system and user stakes/balances (integrated P&L or standalone?).
- Role of the relay APIs + admin hot wallets (user deposits? platform settlement? internal treasury?).
- Why PHP as the order currency?
- Maturity / priority of the full crypto wallet surfaces (send/receive/swap to contacts) vs the product-purchase pay flow.
- Who/ what posts to the `/api/bets/r*` endpoints?
- Plans for the "36" branding and additional tiers?

---

## How to Use This Index

- **For new work**: Start here + read the specific `d.ts` + mutation files for the domain you're touching.
- **Architecture reviews**: Use the LANGUAGE.md vocabulary from `.agents/skills/improve-codebase-architecture/` when proposing deepenings.
- **Domain modeling**: This can seed `CONTEXT.md` (see `grill-with-docs` skill). Extract the entities table + business rules into a proper glossary.
- **Onboarding**: Point new contributors at this file + the yf2 README + the orders confirm flow.

---

**Source**: Generated by `spawn_subagent` (explore type) with a detailed indexing prompt, augmented by direct file inspection of schema, key flows, and UI. All claims are grounded in actual code paths and text.

To update: re-run exploration or edit manually when major refactors land.
