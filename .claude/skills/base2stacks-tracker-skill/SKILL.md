---
name: base2stacks-tracker-skill
description: Bitcoin DeFi dashboard on Stacks L2 mainnet (SP1V72500C63KN9E348QDK9X879MASSTN0J3KBQ5N) — daily $B2S claim, dual staking systems, STX/B2S AMM swap, cross-chain bridge fee-router, static NFT badge gallery, and a Claude-powered DeFi assistant. Use this skill for anything touching the Next.js frontend's on-chain calls, which of the 11 deployed contracts is actually wired to the UI, or where README/MCP claims diverge from the real frontend code.
homepage: https://base2stacks-tracker.vercel.app
license: MIT
metadata:
  author: wkalidev
  version: 1.0.0
---

# Base2Stacks Tracker

Next.js 16 / React 19 dashboard for the $B2S ecosystem on Stacks mainnet (Bitcoin L2).
11 Clarity contracts are deployed under `SP1V72500C63KN9E348QDK9X879MASSTN0J3KBQ5N`, but
only **6** of them have any live on-chain call in the frontend. The rest are declared,
described in the README/MCP server/A2A card, or partially scaffolded in `src/lib` — but
have zero UI wiring. Don't assume "listed in README" == "usable in the app."

> **Source availability:** only `contracts/b2s-token-v4.clar` exists in this repo. The
> other 10 contracts (`b2s-staking-vault-v2`, `b2s-rewards-distributor-v3`,
> `b2s-liquidity-pool-v6`, `b2s-fee-router`, `b2s-governance`, `b2s-prediction-market`,
> `b2s-price-oracle`, `b2s-badges`, `b2s-marketplace`, `b2s-airdrop`) have **no Clarity
> source checked in here** — their behavior can only be inferred from the frontend's
> `callReadOnlyFunction`/`openContractCall` sites and from `explorer.hiro.so`, never from
> a local `.clar` file. Say so explicitly if asked to explain their internal logic.

> **Wiring source of truth:** `src/lib/contracts.ts` (the `CONTRACTS` map) is the closest
> thing to a canonical list, but even it's incomplete/stale — it's missing
> `b2s-prediction-market`, `b2s-price-oracle`, `b2s-airdrop`, and lists `badges:
> 'b2s-badges'` even though nothing calls it live. Always cross-check against the actual
> hook/component making the call, not just this map.

## Capabilities

### 1. Wallet & daily rewards
- Connect via `@stacks/connect`'s `showConnect` (`src/hooks/useWallet.ts`). Both Leather
  and Xverse work; Leather sets `window.StacksProvider` as an **immutable** global that
  shadows Xverse's own injection, so `useWallet.ts:17-24` (`preferXverseIfAvailable`)
  checks `window.XverseProviders.StacksProvider` directly and calls
  `setSelectedProviderId('XverseProviders.StacksProvider')` before `showConnect` — this
  is what makes Xverse win over Leather when both are installed and neither is already
  selected.
- **Claim path (real):** `useContract().claimDailyReward()` in `src/hooks/useContract.ts:38-55`
  calls `claim-daily-reward()` on `b2s-token-v4`, wired from `HeroAnimated`'s claim button
  via `handleClaim` in `src/app/page.tsx:141-147`. Mints exactly `u5000000` (5 $B2S, 6
  decimals) once per `block-height / 144` day, per address
  (`contracts/b2s-token-v4.clar:253-277`, `ERR-ALREADY-CLAIMED`/`err-already-claimed`).
- **Ignore `src/hooks/useDailyReward.ts`** — dead code (not imported by any component)
  and broken: it calls `contractName: 'b2s-token'` (`useDailyReward.ts:21`), which is not
  a deployed contract name (the real one is `b2s-token-v4`). Never suggest wiring this
  hook in as-is.
- The token contract itself also has vestigial `stake`/`get-staked-balance`/
  `calculate-reward-multiplier` functions (`b2s-token-v4.clar:103-138, 279+`) tied to a
  bridge-tracker reputation system — unrelated to, and not the same balance as, either of
  the two real staking paths below. Nothing in the frontend calls these.

### 2. Live market data
- `src/components/MarketData.tsx` — price/market-cap/volume from `GET /api/market`
  (`src/app/api/market/route.ts`, CoinGecko `blockstack` coin, server-side, supports
  `COINGECKO_API_KEY`), auto-refreshing. Chart is an embedded TradingView Advanced Chart
  widget script (`MarketData.tsx:123-172`), not app-computed candles — it's the public
  STX/USD chart, unrelated to the B2S/STX pool.

### 3. AMM swap — `b2s-liquidity-pool-v6`
- Real call site: `src/hooks/useSwap.ts`, used by `src/components/SwapInterface.tsx`
  (page section `// AMM_SWAP`, `src/app/page.tsx:303-306`, alongside `PoolRequest`).
  Reads `get-reserves()` every 30s (`useSwap.ts:38-56`); executes
  `swap-stx-for-b2s`/`swap-b2s-for-stx` (`useSwap.ts:79-109`).
- Quote math lives in `src/lib/swap.ts` (`calcAmountOut`/`calcPriceImpact`/
  `calcMinAmountOut`) — constant-product `x*y=k`, 25 bps (0.25%) fee, client-side only,
  used purely to preview the trade before signing.
- **`src/lib/pool.ts` is an unused near-duplicate** of `swap.ts` (`calcSwapOutput`,
  `calcLPTokens`, etc.) — not imported anywhere. Don't confuse the two; `swap.ts` is the
  live one.
- Slippage: 0.5% / 1% / 2% selectable in the UI (`SwapInterface.tsx:8`), price-impact
  warning above 5%. Empty-pool state (`pool.empty`, reserves == 0) disables swapping and
  shows a banner telling the owner to call `add-b2s-stx(b2s_amount, stx_amount)` — check
  current reserves live before claiming the pool has liquidity.

### 4. Staking — two separate, independently-funded contracts
Do not conflate these. Staking into one does **not** appear as a balance in the other.

- **`b2s-staking-vault-v2`** (the "confirmed live" vault per `src/lib/contracts.ts:10`
  and `src/hooks/useVault.ts:19`, `src/hooks/useContract.ts:16`):
  - Write path: `useContract().stake(amount, lockBlocks)` / `.unstake()`
    (`useContract.ts:57-96`), fired from the Hero's "STAKE" modal in `src/app/page.tsx`
    (`handleStake`, `page.tsx:149-163`). **That modal only collects an amount — it never
    passes `lockBlocks`, so every stake made through it defaults to `lockBlocks = 0`
    (no lock, base 12.5% APY).** There is no lock-period selector anywhere in that flow.
  - Read path: `src/hooks/useVault.ts` (`get-vault`), `src/hooks/useMultiplier.ts`
    (`get-multiplier-for`), surfaced in `src/components/StakingStats.tsx` (page section
    "// YOUR_STAKING", only rendered when a wallet is connected).
  - `b2s-staking-vault-v3` from the README's contract table is **not referenced anywhere
    in `src/`** — grep it before trusting the README; only v2 is wired.
- **`b2s-rewards-distributor-v3`** (separate contract, separate balance):
  - Full stake/unstake/claim UI lives in `src/components/RewardsDistributor.tsx` (page
    section "// REWARDS_DISTRIBUTION", `page.tsx:316-318`). This is the **only** place in
    the app where a user can actually pick a lock period —
    `LOCK_OPTIONS` at `RewardsDistributor.tsx:19-24`: `0 / 525 / 1050 / 2100` blocks →
    `12.5% / 18.75% / 25% / 37.5%` APY, labeled `NO_LOCK / 3.5D_LOCK / 7D_LOCK /
    14D_LOCK`. Calls `stake`, `unstake`, `claim-rewards` directly on
    `b2s-rewards-distributor-v3` (not the vault), reads `get-staker-info` /
    `get-pending-rewards`.
  - **These block counts (525/1050/2100 at 144 blocks/day) are ~3.65 / 7.3 / 14.6 real
    days** — the `3.5D`/`7D`/`14D` labels here are accurate. Contrast with pitfall below.
- **Pitfall — do not trust "70 days"/"365 days" claims for these tiers.** The README
  ("25% — 70 days, 37.5% — 365 days") and the MCP server's `get_staking_info` tool
  (`src/app/api/mcp/route.ts:165-169`, hardcoded `'70 days'`/`'365 days'`) both describe
  lock durations that don't match the actual on-chain tiers (~3.65/7.3/14.6 days per
  `RewardsDistributor.tsx`'s `LOCK_OPTIONS`, confirmed against `src/lib/staking.ts`'s
  identical `LOCK_PERIODS`). Always cite the block-based tiers from the code, not README
  prose or the MCP tool's static payload.
- **The "// APY_CALCULATOR" page section is a pure client-side toy, not connected to
  either staking contract.** `src/components/APYCalculator.tsx` invents its own
  `LOCK_TIERS` (1W/1M/3M/6M/1Y, up to 730 days, user-adjustable "BASE_APY" slider 0–50%,
  `APYCalculator.tsx:7-13,268`) purely for illustration/compound-interest simulation.
  Never use its numbers as evidence of real contract behavior — it doesn't call
  `callReadOnlyFunction` at all.
- `src/lib/apy.ts` and `src/lib/staking.ts` both duplicate the real 0/525/1050/2100 tier
  table but **neither is imported by any component** — the live tier data is hardcoded
  independently in `RewardsDistributor.tsx` and `StakingStats.tsx`'s `MULT_LABEL`.

### 5. Cross-chain bridge — `b2s-fee-router`
- `src/components/BridgeRouter.tsx` (page section "// CROSS_CHAIN_BRIDGE"). The contract
  **only does fee bookkeeping** — it does not execute the actual bridge transfer. The
  "BRIDGE" tab links out to external bridge protocols; the "RECORD" tab then calls
  `record-bridge(amount)` on `b2s-fee-router` (`BridgeRouter.tsx:122-140`) to log the STX
  amount and take a fee, split 50% treasury / 50% stakers per the UI's own comment
  (`BridgeRouter.tsx:15-18`) — this split isn't independently verifiable since the
  contract source isn't in this repo.
- **Real bridge list is 6, not 7:** `BRIDGE_LIST` in `BridgeRouter.tsx:30-37` is Stargate
  (recommended), deBridge (affiliate link), Across, Celer cBridge, Orbiter, Jupiter
  (affiliate link). **No "Rango"** — that's in the README's list of 7 but not in the code.
  deBridge and Jupiter URLs carry referral params (`?r=`/`?ref=`) — flag as affiliate
  links if asked to reproduce them.
- `get-stats()` / `get-user-stats(principal)` are read live every 30s
  (`BridgeRouter.tsx:65-108`) for the fee rate, volume, and per-user counters shown in
  the STATS tab; UI's default `feeBps` before the first fetch is `30` (0.3%).
- **MCP's `get_bridge_routes` tool is entirely fabricated data**, not derived from
  `b2s-fee-router` or `BRIDGE_LIST`: hardcoded per-bridge fees/times for Stargate/
  deBridge/Across (`src/app/api/mcp/route.ts:189-192`) that don't match the single global
  `fee-bps` the contract actually charges, and it's missing Celer/Orbiter/Jupiter
  entirely. Don't repeat these numbers as if they were real quotes.

### 6. Governance DAO — declared, not built
- `src/lib/governance.ts` has constants matching the README (`MIN_VOTE_AMOUNT=1000`,
  `MIN_PROPOSAL_AMOUNT=10000`, `VOTING_PERIOD=1008` blocks ≈ 7 days, `QUORUM_PERCENT=20`,
  `APPROVAL_PERCENT=51`) plus `canVote`/`canPropose`/`calcQuorum` helpers — but **nothing
  imports this file**, and **there is no governance/DAO component in `src/components`
  at all**. `b2s-governance` is declared in `contracts.ts` but has zero
  `callReadOnlyFunction`/`openContractCall` sites anywhere in `src`.
- If asked to add governance UI, treat this as new feature work, not "reconnecting"
  something — there's no partial UI to resume.

### 7. NFT badges — static gallery, not a live marketplace
- `src/components/NFTMarketplace.tsx` (page section "// NFT_BADGE_MARKETPLACE",
  dynamically imported with `ssr: false`) renders a **hardcoded array** `IPFS_BADGES`
  (`NFTMarketplace.tsx:20-589`) of badge metadata + Pinata IPFS image URLs, with a
  3-gateway fallback (`ipfs.io` → `dweb.link` → `gateway.pinata.cloud`,
  `NFTMarketplace.tsx:5-9`). Series are derived purely from `tokenId` range
  (`getSeries`, `NFTMarketplace.tsx:622-626`): `≤170` → Infosec, `≤500` → Glitch Art,
  `>500` → Galactic — consistent with the README's "#1-170 / #201-500 / #501-600" ranges
  once you account for gaps in the hardcoded id list (matches the "567" total via
  `IPFS_BADGES.length`, not a literal `600 - gaps` count you should recompute yourself).
  5 rarities: common/uncommon/rare/epic/legendary.
- **No on-chain call exists in this component or anywhere it's used** — no
  `openContractCall`, no `b2s-marketplace` read/write, no buy/sell/list transaction. It's
  a browsable, filterable, paginated image gallery, full stop.
- `src/hooks/useListings.ts`, `useNFTPrice.ts`, `useSales.ts`, `useMint.ts`,
  `useTransfer.ts`, `useBadgeOwner.ts`, `useBadgeInfo.ts`, `useCollection.ts`,
  `useTokenURI.ts`, `useLastTokenId.ts`, and `useEligibility.ts` (which calls
  `b2s-badges.check-eligibility`, `useEligibility.ts:15-26`) **all exist but are imported
  by zero `.tsx` files** — dead scaffolding for a marketplace that was never wired up. If
  asked to "finish" the NFT marketplace, these hooks are the closest thing to a starting
  point, but none of them are currently reachable from the UI.
- The 2.5% marketplace fee (`src/lib/marketplace.ts:1`, `PLATFORM_FEE_BPS = 250`) is
  likewise unused math with no live call site.

### 8. Prediction market — defined, not rendered
- `useContract().placeBet(marketId, vote, amount)` / `.createMarket(...)`
  (`src/hooks/useContract.ts:122-166`) target `b2s-prediction-market`, but **no component
  calls either function** and **no `PredictionMarket` component exists** in
  `src/components` — grep confirms zero references outside `useContract.ts` itself.
  There is no "// PREDICTION_MARKET" section in `src/app/page.tsx`.
- `src/lib/prediction.ts` has `calcOdds` (AMM-style yes/no split) and
  `calcPotentialReturn`, which nets out a **2.5%** fee (`* 0.975`,
  `prediction.ts:26`) — this conflicts with the README's "2% platform fee" claim; trust
  the code's 2.5% if asked, and flag the README as stale on this point.
- `b2s-prediction-market` isn't even listed in `src/lib/contracts.ts`'s `CONTRACTS` map —
  its address/name is hardcoded inline in `useContract.ts:128,151` instead.

### 9. AI DeFi Assistant — Claude Haiku, 3 live tools
- `src/app/api/agent/route.ts`, model `claude-haiku-4-5-20251001` via
  `@anthropic-ai/sdk`, requires `ANTHROPIC_API_KEY` (returns 503 with an explicit "set it
  in Vercel" message if missing, `route.ts:163-168`). Rate-limited 10 req/min/IP
  (in-memory `Map`, resets per server instance — not durable across deploys/regions).
- Exactly **3 tools** the model can call (`TOOLS`, `route.ts:25-50`):
  1. `get_prices` — live CoinGecko STX + BTC + ETH (`route.ts:55-79`).
  2. `get_staking_stats` — live Hiro tx-count + STX balance for
     `b2s-staking-vault-v2` only, plus a **hardcoded** `apy_tiers` object
     (`route.ts:82-96`) — no live read of the actual multiplier/vault state.
  3. `get_wallet_balance` — live Hiro STX + $B2S balance for any `SP…`/`ST…` address
     (`route.ts:98-111`).
- The system prompt (`route.ts:121-142`) *describes* the AMM, sBTC, NFT badges, bridge,
  and rewards-distributor — but the agent has **no tool** to query the pool reserves,
  bridge fee-router stats, badge collection, or rewards-distributor pending rewards live.
  Any answer about those topics is prose from the system prompt, not a real-time
  on-chain read — say so if asked "can the agent tell me live X" for anything outside the
  3 tools above.
- Separate, wider **MCP server** at `src/app/api/mcp/route.ts` (`GET`/`POST`, JSON-RPC
  `tools/list`/`tools/call`) exposes 6 tools for external MCP clients (Claude Desktop,
  Cursor, etc.) — see capability 3/4/5/7 above for which of those 6 are backed by live
  reads (`get_b2s_stats`, `get_swap_quote`) versus static/hardcoded payloads
  (`get_staking_info`, `get_bridge_routes`, `get_leaderboard`, `get_nft_badges`). This is
  a different implementation from the in-app agent — don't assume the two share tool
  logic or a system prompt.

## Research Workflow

| Question | Where to look |
|---|---|
| Is contract X actually called anywhere in the UI? | `Grep` for the contract name string across `src/` — presence in `src/lib/contracts.ts` or the README proves nothing by itself (see governance/prediction-market/price-oracle/airdrop, all zero-wired) |
| Which staking contract does a given UI element write to? | Check the component directly: Hero's stake modal (`page.tsx`) → `b2s-staking-vault-v2` via `useContract.ts`, no lock option; "REWARDS_DISTRIBUTION" section → `b2s-rewards-distributor-v3` via `RewardsDistributor.tsx`, has lock options |
| What's the real AMM quote math? | `src/lib/swap.ts` (live, used by `useSwap.ts`) — not `src/lib/pool.ts` (unused duplicate) |
| Is a hook/lib file actually wired to a page? | `Grep` for the import path across `src/**/*.tsx` — several `src/hooks/*` and `src/lib/*` files (governance, prediction, marketplace, badges, dao, apy, staking, pool, airdrop) are unused scaffolding |
| What are the real staking lock tiers/APYs? | `RewardsDistributor.tsx`'s `LOCK_OPTIONS` (`0/525/1050/2100` blocks, `12.5/18.75/25/37.5%`) — not the README's day counts, not the MCP `get_staking_info` payload, not `APYCalculator.tsx` (unrelated simulator) |
| Does the app support a feature X (governance vote, NFT buy, prediction bet)? | Search `src/app/page.tsx` for a matching `<Section>` — if there's no section, there's no UI, regardless of what `src/lib` or the README imply |
| What model/tools power the chat agent vs. the MCP server? | `src/app/api/agent/route.ts` (in-app chat, 3 tools, Claude Haiku) vs. `src/app/api/mcp/route.ts` (external MCP clients, 6 tools, no LLM — plain JSON-RPC handlers) — separate code paths |
| Is a claimed number (fee %, bridge list, day count) accurate? | Prefer the component/hook that performs the actual contract call or computation over README prose, MCP tool text, or agent system-prompt text — all three have confirmed drift from the code in this app |

## Important Rules

| Rule | Value | Source |
|---|---|---|
| Daily reward amount | 5 $B2S (`u5000000`, 6 decimals), 1x per `block-height / 144` day | `contracts/b2s-token-v4.clar:253-277` |
| Real claim call | `useContract().claimDailyReward()` → `b2s-token-v4.claim-daily-reward` | `src/hooks/useContract.ts:38-55`; **not** `useDailyReward.ts` (dead, wrong contract name) |
| AMM swap fee | 0.25% (25 bps), constant product `x*y=k` | `src/lib/swap.ts`, `src/hooks/useSwap.ts` |
| Vault-v2 stake via Hero modal | Always `lockBlocks = 0` (no lock option exposed) | `src/app/page.tsx` `handleStake` |
| Rewards-distributor-v3 lock tiers | `0 / 525 / 1050 / 2100` blocks → `12.5 / 18.75 / 25 / 37.5%` APY | `src/components/RewardsDistributor.tsx:19-24` |
| Two staking balances are separate | Staking via the Hero modal (vault-v2) ≠ staking via Rewards Distributor (rewards-distributor-v3) | confirmed by distinct contract names in each write call |
| Bridge fee-router split | 50% treasury / 50% stakers (UI-stated, contract source not available to verify) | `src/components/BridgeRouter.tsx:15-18` |
| Live bridge list | 6 bridges: Stargate, deBridge, Across, Celer cBridge, Orbiter, Jupiter (no Rango) | `src/components/BridgeRouter.tsx:30-37` |
| NFT badge total / series | 567 badges — Infosec `≤170`, Glitch Art `≤500`, Galactic `>500`, 5 rarities | `src/components/NFTMarketplace.tsx` `IPFS_BADGES`, `getSeries` |
| NFT marketplace on-chain wiring | None — static gallery only, no buy/sell/list transaction anywhere | `src/components/NFTMarketplace.tsx` (no `openContractCall`) |
| Governance UI | None exists — `b2s-governance` and `src/lib/governance.ts` are unwired | confirmed via repo-wide grep |
| Prediction market UI | None exists — `placeBet`/`createMarket` defined but never called | `src/hooks/useContract.ts:122-166`, no component uses them |
| Prediction market fee | 2.5% (code) — README says 2%, code wins | `src/lib/prediction.ts:26` |
| AI agent model | `claude-haiku-4-5-20251001`, 3 tools only (prices, staking stats for vault-v2, wallet balance) | `src/app/api/agent/route.ts` |
| ANTHROPIC_API_KEY | Required server-side for `/api/agent`; missing key → explicit 503, not silent failure | `src/app/api/agent/route.ts:163-168` |
| Contract source availability | Only `b2s-token-v4.clar` is in this repo; the other 10 deployed contracts have no local source | `contracts/` directory listing |

## References

- `src/lib/contracts.ts` — the closest thing to a canonical wired-contracts map (incomplete — see capability sections above for what's missing/stale)
- `src/hooks/useContract.ts` — token claim/transfer, vault-v2 stake/unstake, prediction-market `placeBet`/`createMarket` (unused)
- `src/hooks/useSwap.ts`, `src/lib/swap.ts` — the live AMM swap path and quote math
- `src/components/RewardsDistributor.tsx`, `src/components/StakingStats.tsx`, `src/hooks/useVault.ts`, `src/hooks/useMultiplier.ts` — the two staking systems
- `src/components/BridgeRouter.tsx` — fee-router bookkeeping + external bridge links
- `src/components/NFTMarketplace.tsx` — static badge gallery (867 lines, mostly the hardcoded `IPFS_BADGES` array)
- `src/app/api/agent/route.ts` — in-app Claude Haiku assistant
- `src/app/api/mcp/route.ts` — external-facing MCP server (separate tool set, mixed live/static)
- `contracts/b2s-token-v4.clar` — the only Clarity source in this repo
- `README.md` — marketing-oriented feature/contract overview; verify every specific number against the code before repeating it, several are confirmed stale (lock-tier day counts, bridge count/list, prediction-market fee %)
