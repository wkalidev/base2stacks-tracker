# Changelog

All notable changes to Base2Stacks Tracker.

---

## [2.0.0] - 2026-03-11 — Full DeFi Platform 🚀

### Added — Smart Contracts (Mainnet SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96)
- `b2s-token-v4` — Clarity 4, correct URI
- `b2s-liquidity-pool-v5` — AMM with active liquidity
- `b2s-liquidity-pool-v6` — USDCx pairs
- `b2s-rewards-distributor-v3` — Daily reward distribution
- `b2s-prediction-market` — AMM-style prediction markets
- `b2s-governance` — On-chain DAO voting
- `b2s-price-oracle` — Clarity 4 price oracle
- `b2s-staking-vault-v2` — Staking with APY multipliers
- `b2s-airdrop-v2` — Token airdrop distribution
- `b2s-fee-router` — Bridge fee collection & distribution (0.3%)

### Added — NFT Badge Marketplace
- 567 unique badges across 3 series:
  - Série 1: Infosec Original (#1–#170) — cybersecurity themes, 3 Legendaries
  - Série 2: Glitch Art (#201–#500) — 300 generative badges
  - Série 3: Ultra Rare Galactic (#501–#600) — Galactic / Base / Degen / Stack
- All images on IPFS via Pinata, multi-gateway fallback
- 5 rarity tiers: Common → Legendary
- 2.5% platform fee

### Added — Cross-Chain Bridge Router
- 7 bridges integrated: Stargate, deBridge, Across, Celer, Orbiter, Rango, Jupiter
- On-chain fee recording via `b2s-fee-router`
- 4 passive revenue streams active

### Added — Core Features
- AMM Liquidity Pool — B2S ↔ STX swaps, 0.25% fee, x*y=k formula
- Governance DAO — on-chain proposals, 7-day voting, 10K B2S minimum
- Prediction Market — AMM-style odds, 5 categories including Crisis Alert 🚨
- TradingView Advanced Chart — candlesticks, RSI, 5 timeframes
- AI DeFi assistant — Groq, 10 on-chain tools
- Analytics dashboard — TVL, staking stats, block height
- WebSocket real-time updates
- Neon Punk Infosec UI redesign

### Changed
- Network: testnet → **mainnet**
- Contract address: `ST936...` → `SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96`
- Live URL: updated to `base2stacks-tracker.vercel.app`

---

## [1.2.0] - 2026-02-08 — Advanced Features

### Added
- Advanced leaderboard with badge system
- Interactive APY calculator
- Toast notification system
- Export functionality (CSV/JSON)
- Performance optimizations + SEO

---

## [1.1.0] - 2026-02-07 — Enhanced UI

### Added
- Staking statistics dashboard
- Glass morphism design
- Loading states and skeletons
- Comprehensive documentation

---

## [1.0.0] - 2026-02-06 — Genesis

### Added
- Smart contract deployment
- Wallet connection (Leather & Xverse)
- Daily reward claiming (5 $B2S)
- Basic staking interface
- Transaction history
- Leaderboard + APY calculator

---

**Format**: [Keep a Changelog](https://keepachangelog.com/)
**Versioning**: [Semantic Versioning](https://semver.org/)