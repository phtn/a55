# Stake Platform

Primary context for the stake.st / 36*stake*St platform. Users acquire tiered "stakes" (poker-persona products) via crypto payments; these materialize as account value with associated ledger history. The platform also provides stock discovery, advanced roulette strategy tooling ("Bets"), and crypto wallet management.

## Language

**Account**:
The user's primary container and identity within the platform. Created automatically on first Firebase-authenticated session. Holds an editable title and a denormalized list of active stake IDs. One Account per Firebase subject (sub).
_Avoid_: User profile, dashboard, wallet

**Stake**:
A materialized position of value purchased via a product tier. Has amount (USD), title (e.g. "Phil Ivey"), level (1-3), and flags (isStaked, isActive). Contributes directly to the user's displayed "Stake Value". Created only inside `confirmOrderPayment`.
_Avoid_: Position, investment, subscription, bet

**Product**:
One of three fixed purchasable tiers named after poker/gambling personalities:
- Dana White (level 1, $15) — "An King level tier. Suitable for mortals vulnerable to pain."
- Mikki Mase (level 2, $30) — "A Demigod level tier..."
- Phil Ivey (level 3, $70) — "A Regicidal level tier..."
Products drive order creation and ultimately Stake creation. Hardcoded in the ProductList component.

**Order**:
A purchase record for a Product. Starts in `pending` status with pricing (totalCents in PHP, processing fees, crypto equivalents). On successful on-chain payment, `confirmOrderPayment` transitions it to completed and creates the corresponding Stake + ledger entries.
_Avoid_: Purchase, transaction, checkout

**Ledger**:
The combination of `txns` (immutable posted entries with title/description/amount) and `history` (balance snapshots with change/changePct and monthly summaries). Used for "Stake Value", recent activity, and area charts. Never mutated in place after creation.
_Avoid_: Balance, transactions, journal

**History Entry**:
A point-in-time balance snapshot for charting and change calculation. Types include 'seed' (initial zero on Account creation) and 'order_completed'. Carries `amount`, `change`, `changePct`, and a `summary` label.
_Avoid_: Balance update, snapshot

**Txn**:
An individual immutable ledger line created on order confirmation (and potentially other value events). Linked to both user and account.

**User Crypto Wallet**:
A user-owned or imported address on a specific network (eip155 / bip122 etc.). Stores rich metadata: walletType, assets enabled, tags, source (manual / wallet_connect / imported), isPrimary, isArchived. The persistent address book for the platform's crypto surfaces.
_Avoid_: Address, wallet (too generic)

**Contact**:
A user-defined recipient with name/email/notes plus one or more labeled wallet addresses (via contact_wallet_addresses). Intended targets for sends/transfers.

**Relay**:
Platform-operated on-chain infrastructure (EVM + Bitcoin) whose private credentials are stored in the admin KV table and consumed by the relay API routes. Used for privileged operations (not user-controlled wallets).

**Bets / KIMS ALGO**:
The advanced roulette strategy surface and data model. Includes quadrant definitions, virtual board state, profit tracking, and external result ingestion via `/api/bets/r1` and `/api/bets/r2`. Currently appears as a specialized feature alongside stakes (relationship to Account value not yet fully wired in visible code).

## Relationships

- A **Firebase User** (via Google OAuth) produces exactly one **Account** (keyed by `sub`).
- An **Account** owns zero or more **Stakes** (via the `stakes` array + foreign keys). Stake Value is the sum of active stake amounts.
- An **Order** for a **Product** is created in pending state; successful crypto payment triggers `confirmOrderPayment`, which atomically creates one **Stake** + **Txn** + **History Entry** and links the stake back to the order.
- **Ledger** (`txns` + `history`) is append-only and derived from value events (primarily order confirmations + initial seed).
- A **User** owns many **User Crypto Wallets** (across networks) and **Contacts** (with their addresses). These power the send/receive surfaces in lib/appkit.
- The **Admin** KV table holds platform configuration (especially relay wallet credentials) consumed by privileged API routes.

## Example dialogue

> **Dev:** "When a user buys a Product, do we create the Stake immediately?"
> **Domain expert:** "No. We create a pending Order first. Only after the on-chain payment succeeds and we call confirmOrderPayment do we materialize the Stake, post the Txn, and write the History entry. The Order record stays as the audit link."
>
> **Dev:** "Is a User Crypto Wallet the same as a Contact's address?"
> **Domain expert:** "No. User Crypto Wallets are the user's own addresses (self-custody, imported, watch-only, etc.) with asset enablement. Contacts are external recipients the user wants to send to. Both live under the User but serve different roles in the wallet flows."

## Flagged ambiguities

- "Stake" carries dual resonance (staking value + poker stakes) — currently the product tiers lean into the gambling/poker persona naming while the ledger treats them as value positions. This tension is intentional in the current branding but should be watched if the model evolves.
- PHP is used as the currency for Order totals and fees, while products are priced in USD and all crypto flows are USD-denominated. The reason for this split is not yet visible in code.
- The relationship between the "Bets" roulette system and Account/Stake value/ledger is not yet exercised in the visible purchase or balance flows (Bets may be a parallel specialized feature or future integration point).

## Notes for agents

- When proposing refactors, use the terms above (especially **Account**, **Stake**, **Order**, **Ledger**, **User Crypto Wallet**).
- The core value seam is inside `convex/orders/m.ts` → `confirmOrderPayment`.
- See also: PROJECT-INDEX.md for file-level map and architectural observations.
- This CONTEXT.md should be updated inline during any grilling or architecture sessions (per grill-with-docs and improve-codebase-architecture skills).
