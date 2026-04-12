# 🌉 Base2Stacks Bridge Tracker

[![Mainnet](https://img.shields.io/badge/Network-Stacks%20Mainnet-green?style=for-the-badge&logo=ethereum)](https://explorer.hiro.so/?chain=mainnet)
[![Next.js](https://img.shields.io/badge/Built%20with-Next.js%2014-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Stacks](https://img.shields.io/badge/Blockchain-Stacks-5546FF?style=for-the-badge&logo=stacks)](https://www.stacks.co/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](./LICENSE)
[![Builder Rewards](https://img.shields.io/badge/Stacks-Builder%20Rewards%20March%202026-orange?style=for-the-badge)](https://stacks.org)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)

## 🌐 Live App

**[https://base2stacks-tracker.vercel.app](https://base2stacks-tracker.vercel.app)**

---

## 📋 Overview

Base2Stacks is a full-stack DeFi platform on Stacks **mainnet**. Track cross-chain bridges between Base & Stacks, earn $B2S tokens, swap, stake, vote, and bet on real-world outcomes — all powered by real on-chain data.

---

## 📦 Smart Contracts (Mainnet — SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96)

| Contract | Description |
|---|---|
| `b2s-token` | Original $B2S token |
| `b2s-token-v4` | Correct URI, Clarity 4 |
| `b2s-liquidity-pool-v5` | AMM pool with active liquidity |
| `b2s-liquidity-pool-v6` | USDCx pairs |
| `b2s-rewards-distributor-v3` | Daily reward distribution |
| `b2s-prediction-market` | AMM-style prediction markets |
| `b2s-governance` | On-chain DAO voting |
| `b2s-price-oracle` | Clarity 4 price oracle |
| `b2s-staking-vault-v2` | Staking with APY multipliers |
| `b2s-airdrop-v2` | Token airdrop distribution |
| `b2s-fee-router` | Bridge fee collection & distribution |

---

## ✨ Features

### 🔗 Wallet & Rewards
- Connect with **Leather** or **Xverse**
- Claim **5 $B2S** daily rewards
- Real-time balance tracking from mainnet

### 📊 Live Market Data
- STX/USD price via **CoinGecko API** (no key required)
- **TradingView** Advanced Chart — candlesticks + RSI
- Timeframes: 1D / 1W / 1M / 3M / 1Y
- Market cap, volume, ATH, circulating supply
- Auto-refresh every 60s with server-side cache

### 💧 AMM Liquidity Pool
- B2S ↔ STX swaps with **0.25% fee**
- Uniswap v2-style constant product formula (x*y=k)
- LP token minting and liquidity provision
- Configurable slippage (0.5% / 1% / 2%)
- B2S/USDCx pairs on v6

### 💰 Staking & Rewards
- Stake $B2S to earn **12.5% base APY**
- APY multipliers: 1.5x / 2x / 3x based on lock duration
- Real-time pending rewards from `b2s-staking-vault-v2`
- Instant unstake — no lock period

### 🌉 Cross-Chain Bridge
- 7 bridges: Stargate, deBridge, Across, Celer, Orbiter, Rango, Jupiter
- On-chain fee recording via `b2s-fee-router`
- 0.3% fee — 50% treasury / 50% stakers

### 🏛️ Governance DAO
- On-chain proposals from `b2s-governance` contract
- 1 token = 1 vote — voting power from staked balance
- 7-day voting period, quorum enforcement
- Requires 10,000 $B2S staked to create proposals

### 🛒 NFT Badge Marketplace
- **567 unique badges** across 3 series:
  - 🔐 **Série 1 — Infosec Original** (#1–#170): cybersecurity themes, 3 Legendaries
  - 🎨 **Série 2 — Glitch Art** (#201–#500): 300 generative glitch badges
  - 🌌 **Série 3 — Ultra Rare Galactic** (#501–#600): Galactic / Base / Degen / Stack themes
- 5 rarity tiers: Common → Legendary
- All images on IPFS via Pinata, multi-gateway fallback
- 2.5% platform fee

### 🔮 Prediction Market
- 5 categories: **Price / Stacks / Governance / Sport / Crisis Alert** 🚨
- AMM-style odds based on bet pool
- Create your own markets
- 2% platform fee on winnings

### 📈 Analytics & Leaderboard
- Top stakers from real `b2s-staking-vault-v2` transactions
- Live stats: total staked, total vaults, block height
- Transaction history with CSV/JSON export
- Analytics dashboard with on-chain metrics

### 🤖 AI DeFi Assistant
- On-chain AI agent with 10 tools (Groq)
- Natural language queries for contract data
- Market analysis and strategy suggestions

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Leather or Xverse wallet

### Installation
```bash
git clone https://github.com/wkalidev/base2stacks-tracker.git
cd base2stacks-tracker
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables
```bash
# .env.local (optional — all defaults work without any key)
NEXT_PUBLIC_CONTRACT_ADDRESS=SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96
NEXT_PUBLIC_CONTRACT_NAME=b2s-token-v4
NEXT_PUBLIC_BASE_URL=https://base2stacks-tracker.vercel.app
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React, TypeScript |
| Styling | Tailwind CSS |
| Blockchain | Stacks, Clarity 4 |
| Wallet | @stacks/connect |
| Blockchain API | Hiro Mainnet API |
| Market Data | CoinGecko Public API |
| Charts | TradingView Advanced Chart |
| NFT Storage | Pinata IPFS (multi-gateway) |
| AI Agent | Groq API |
| Deployment | Vercel |

---

## 📁 Project Structure

```
base2stacks-tracker/
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── api/
│   │       ├── market/route.ts       # CoinGecko proxy (60s cache)
│   │       └── agent/route.ts        # AI agent (10 tools, Groq)
│   ├── hooks/
│   │   ├── useWallet.ts
│   │   ├── useContract.ts
│   │   ├── useBalance.ts
│   │   ├── useDashboardStats.ts
│   │   └── useStacksWebSocket.ts
│   └── components/
│       ├── MarketData.tsx
│       ├── LiquidityPool.tsx
│       ├── StakingAndRewards.tsx
│       ├── GovernanceDAO.tsx
│       ├── NFTMarketplace.tsx        # 567 badges (3 series)
│       ├── PredictionMarket.tsx
│       ├── LeaderboardAdvanced.tsx
│       ├── TransactionHistory.tsx
│       ├── AnalyticsDashboard.tsx
│       ├── CrossChainBridge.tsx      # 7 bridges + fee router
│       ├── APYCalculator.tsx
│       └── AgentChat.tsx             # AI DeFi assistant
└── contracts/                        # Clarity contracts (reference)
```

---

## 🔗 Related Repos

| Repo | Description |
|---|---|
| [b2s-token-contract](https://github.com/wkalidev/b2s-token-contract) | All Clarity smart contracts |
| [b2s-analytics-dashboard](https://github.com/wkalidev/b2s-analytics-dashboard) | Analytics dashboard |
| [b2s-nft-badges](https://github.com/wkalidev/b2s-nft-badges) | NFT badge generation scripts + 567 assets |
| [b2s-staking-interface](https://github.com/wkalidev/b2s-staking-interface) | Staking UI components |
| [stacks-clarity-toolkit](https://github.com/wkalidev/stacks-clarity-toolkit) | Clarity dev toolkit |

---

## 💰 Passive Revenue Streams

| Source | Link | Commission |
|---|---|---|
| 🌉 deBridge | [Referral](https://app.debridge.com/r/32893) | % bridged volume |
| ⚡ Rango | [Referral](https://rango.vip/a/o9pwCm) | % swaps |
| ☀️ Jupiter | [Referral](https://jup.ag/?ref=j5ft3v5m26eu) | referral fees |
| 🔗 b2s-fee-router | on-chain | 0.3% bridges |

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📜 License

MIT License — See [LICENSE](./LICENSE)

---

## 👨‍💻 Author

**wkalidev (zcodebase)**

- 🐦 [Twitter](https://twitter.com/willycodexwar)
- 🟪 [Farcaster](https://warpcast.com/willywarrior)
- 🐙 [GitHub](https://github.com/wkalidev)

---

**Built with ❤️ by wkalidev(zcodebase) for #StacksBuilderRewards April 2026 🏆**