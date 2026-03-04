# 🌉 Base2Stacks Bridge Tracker

[![Live](https://img.shields.io/badge/Live-base2stacks--tracker.vercel.app-brightgreen)](https://base2stacks-tracker.vercel.app)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Network](https://img.shields.io/badge/network-Stacks%20Mainnet-orange?logo=ethereum)](https://explorer.hiro.so/?chain=mainnet)
[![Next.js](https://img.shields.io/badge/built%20with-Next.js%2014-black?logo=next.js)](https://nextjs.org/)
[![Stacks](https://img.shields.io/badge/blockchain-Stacks-5546FF?logo=stacks)](https://www.stacks.co/)
[![Builder Rewards](https://img.shields.io/badge/Stacks-Builder%20Rewards%20March%202026-ff6b00)](https://talent.app/~/earn/stacks-builder-rewards-mar)

> Track cross-chain bridge activity between Base & Stacks. Earn $B2S tokens. Built on Stacks mainnet.

---

## 🚀 Live Demo

**[https://base2stacks-tracker.vercel.app](https://base2stacks-tracker.vercel.app)**

---

## 📦 Smart Contracts — Mainnet

| Contract | Address | Explorer |
|---|---|---|
| `b2s-token` | `SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96.b2s-token` | [View ↗](https://explorer.hiro.so/address/SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96.b2s-token?chain=mainnet) |
| `b2s-liquidity-pool-v5` | `SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96.b2s-liquidity-pool-v5` | [View ↗](https://explorer.hiro.so/address/SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96.b2s-liquidity-pool-v5?chain=mainnet) |
| `b2s-rewards-distributor-v3` | `SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96.b2s-rewards-distributor-v3` | [View ↗](https://explorer.hiro.so/address/SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96.b2s-rewards-distributor-v3?chain=mainnet) |

---

## ✨ Features

### 💧 AMM Liquidity Pool
- B2S ↔ STX swaps with **0.25% fee** (Uniswap v2 constant product formula)
- Add/remove liquidity and receive LP tokens
- Slippage protection and real-time price quotes
- Pool stats: TVL, 24h volume, fees

### 💰 Staking & Rewards
- Stake $B2S and earn **12.5% APY**
- Block-based reward calculation
- Auto-claim on stake/unstake
- Pending rewards dashboard

### 🏛️ Governance DAO
- On-chain voting — 1 token = 1 vote
- Proposal creation (10K+ tokens required)
- 7-day voting period with quorum system
- Categories: Economic, Security, Technical, Community

### 🛒 NFT Badge Marketplace
- Buy and sell achievement badges
- 5 rarity tiers: Common → Legendary
- 2.5% platform fee
- Real-time floor price and volume

### 🏆 Leaderboard
- Top stakers with real-time rankings
- Badge system: 👑 🥇 🔥 💎 ⭐
- Filter: Top 10 / Top 50 / All

### Core
- 🔗 Leather & Xverse wallet integration
- 💰 Daily reward claims (5 $B2S / 24h)
- 📊 Real-time balance tracking
- 📈 Interactive APY calculator
- 📱 Fully responsive UI

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React, TypeScript |
| Styling | Tailwind CSS, Glass morphism |
| Blockchain | Stacks, Clarity smart contracts |
| Wallet | @stacks/connect (Leather / Xverse) |
| Deployment | Vercel |

---

## 📁 Project Structure

```
base2stacks-tracker/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main page
│   │   ├── layout.tsx            # Root layout + metadata
│   │   └── globals.css
│   ├── hooks/
│   │   ├── useWallet.ts          # Wallet connection (mainnet)
│   │   ├── useContract.ts        # Contract calls
│   │   └── useBalance.ts         # Balance tracking
│   └── components/
│       ├── StakingStats.tsx
│       ├── RewardsDistributor.tsx
│       ├── TransactionHistory.tsx
│       └── ...
├── contracts/                    # Clarity smart contracts
├── tests/                        # Clarinet test suite
├── docs/                         # Extended documentation
└── deployments/                  # Deployment records
```

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
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96
NEXT_PUBLIC_CONTRACT_NAME=b2s-token
```

---

## 🧪 Tests

```bash
# Clarinet contract tests
clarinet test

# Next.js build check
npm run build
```

---

## 📚 Documentation

| File | Description |
|---|---|
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contribution guidelines |
| [CHANGELOG.md](./CHANGELOG.md) | Version history |
| [ROADMAP.md](./ROADMAP.md) | Upcoming features |
| [SECURITY.md](./SECURITY.md) | Security policy |
| [QUICKSTART.md](./QUICKSTART.md) | 5-minute setup guide |
| [docs/](./docs/) | Extended documentation |

---

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

```bash
# Create a feature branch
git checkout -b feat/your-feature
git commit -m "feat: your feature"
git push origin feat/your-feature
# Open a Pull Request
```

---

## 👨‍💻 Author

**wkalidev** (zcodebase)

[![Twitter](https://img.shields.io/badge/Twitter-@willycodexwar-1DA1F2?logo=twitter)](https://twitter.com/willycodexwar)
[![Farcaster](https://img.shields.io/badge/Farcaster-willywarrior-purple)](https://warpcast.com/willywarrior)
[![GitHub](https://img.shields.io/badge/GitHub-@wkalidev-black?logo=github)](https://github.com/wkalidev)

---

## 📜 License

MIT License — see [LICENSE](./LICENSE)

---

**Built with ❤️ for the Stacks ecosystem — #StacksBuilderRewards 🏆**