# 🌉 Base2Stacks Bridge Tracker

[![Mainnet](https://img.shields.io/badge/Network-Stacks%20Mainnet-green)](https://explorer.hiro.so/?chain=mainnet)
[![Next.js](https://img.shields.io/badge/Built%20with-Next.js%2014-black?logo=next.js)](https://nextjs.org/)
[![Stacks](https://img.shields.io/badge/Blockchain-Stacks-5546FF?logo=stacks)](https://www.stacks.co/)
[![License](https://img.shields.io/badge/License-MIT-blue)](./LICENSE)
[![Builder Rewards](https://img.shields.io/badge/Stacks-Builder%20Rewards%20March%202026-orange)](https://stacks.org)

## 🌐 Live App

**[https://base2stacks-tracker.vercel.app](https://base2stacks-tracker.vercel.app)**

---

## 📋 Overview

Base2Stacks is a full-stack DeFi platform on Stacks mainnet. Track cross-chain bridges between Base & Stacks, earn $B2S tokens, swap, stake, vote, and bet on real-world outcomes.

---

## 📦 Smart Contracts (Mainnet)

| Contract | Address |
|---|---|
| `b2s-token` | `SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96.b2s-token` |
| `b2s-liquidity-pool-v5` | `SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96.b2s-liquidity-pool-v5` |
| `b2s-rewards-distributor-v3` | `SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96.b2s-rewards-distributor-v3` |
| `b2s-prediction-market` | `SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96.b2s-prediction-market` |

---

## ✨ Features

### 🔗 Wallet & Rewards
- Connect with **Leather** or **Xverse**
- Claim **5 $B2S** daily rewards
- Real-time balance tracking

### 💧 AMM Liquidity Pool
- B2S ↔ STX swaps with **0.25% fee**
- Uniswap v2-style constant product formula (x*y=k)
- LP token minting and liquidity provision
- Configurable slippage (0.5% / 1% / 2%)

### 💰 Staking & Rewards
- Stake $B2S to earn **12.5% APY**
- Real-time pending rewards from contract
- Instant unstake — no lock period
- One-click claim rewards

### 🏛️ Governance DAO
- On-chain proposal creation and voting
- 1 token = 1 vote
- 7-day voting period
- Quorum & threshold enforcement

### 🛒 NFT Badge Marketplace
- 5 rarity tiers: Common → Legendary
- Buy, sell, and trade achievement badges
- 2.5% platform fee

### 🔮 Prediction Market
- 5 categories: **Price / Stacks / Governance / Sport / Crisis Alert** 🚨
- AMM-style odds based on bet pool
- Create your own markets
- 2% platform fee on winnings
- Emergency refund mechanism

### 📊 Dashboard
- Live stats from **Hiro Mainnet API** (auto-refresh 60s)
- Token holders, supply, pool reserves, tx count
- Advanced leaderboard — top stakers
- Interactive APY calculator

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

### Build
```bash
npm run build
npm start
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React, TypeScript |
| Styling | Tailwind CSS |
| Blockchain | Stacks, Clarity |
| Wallet | @stacks/connect |
| API | Hiro Mainnet API |
| Deployment | Vercel |

---

## 📁 Project Structure

```
base2stacks-tracker/
├── src/
│   ├── app/
│   │   ├── page.tsx               # Main page
│   │   └── layout.tsx             # Root layout
│   ├── hooks/
│   │   ├── useWallet.ts           # Wallet connection
│   │   ├── useContract.ts         # Contract interactions
│   │   ├── useBalance.ts          # Balance tracking
│   │   └── useDashboardStats.ts   # Live Hiro API stats
│   └── components/
│       ├── LiquidityPool.tsx
│       ├── RewardsDistributor.tsx
│       ├── GovernanceDAO.tsx
│       ├── NFTMarketplace.tsx
│       ├── PredictionMarket.tsx
│       ├── LeaderboardAdvanced.tsx
│       └── APYCalculator.tsx
└── contracts/                     # Clarity contracts (reference)
```

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

**Built with ❤️ for #StacksBuilderRewards March 2026 🏆**