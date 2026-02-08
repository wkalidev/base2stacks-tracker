# 🌉 Base2Stacks Bridge Tracker

[![GitHub stars](https://img.shields.io/github/stars/wkalidev/base2stacks-tracker?style=for-the-badge&logo=github&color=yellow)](https://github.com/wkalidev/base2stacks-tracker)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Testnet](https://img.shields.io/badge/network-testnet-orange.svg?style=for-the-badge&logo=ethereum)](https://explorer.hiro.so/?chain=testnet)
[![Next.js](https://img.shields.io/badge/built%20with-Next.js-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Stacks](https://img.shields.io/badge/blockchain-Stacks-5546FF?style=for-the-badge&logo=stacks)](https://www.stacks.co/)
[![Stacks Builder Rewards](https://img.shields.io/badge/Stacks-Builder%20Rewards-purple?style=for-the-badge)](https://stacks.org)

> 🚀 Track cross-chain bridges between Base & Stacks. Earn $B2S tokens for tracking activity.

## ✨ Live Demo

**Try it now:** [https://wkalidev-base2stacks-tracker.vercel.app](https://wkalidev-base2stacks-tracker.vercel.app)

---

## 🎯 Features

### Core Functionality
- 🔗 **Wallet Connection** - Seamless Leather & Xverse integration
- 💰 **Daily Rewards** - Claim 5 $B2S tokens every 24 hours
- 📊 **Real-time Balance** - Live tracking of your $B2S holdings
- 📈 **Staking System** - Earn 12.5% APY on staked tokens
- 📝 **Transaction History** - Complete record of claims and stakes

### Advanced Features
- 🏆 **Leaderboard** - Top 10 stakers with badges and rankings
- 📊 **APY Calculator** - Interactive earnings estimator
- 💎 **Achievement Badges** - Earn rewards for milestones
- 📈 **Staking Stats** - Comprehensive dashboard analytics

### User Experience
- 🎨 **Professional UI** - Glass morphism design with smooth animations
- 📱 **Mobile Responsive** - Perfect on all devices
- ⚡ **Real-time Updates** - Instant balance and stats refresh
- 🎯 **Intuitive Navigation** - Clean, user-friendly interface
---

## 📊 Smart Contract

- **Address**: `ST936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96.b2s-token`
- **Network**: Stacks Testnet
- **Standard**: SIP-010 Fungible Token
- **Explorer**: [View on Hiro](https://explorer.hiro.so/txid/ST936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96.b2s-token?chain=testnet)

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
```

### Development
```bash
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

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, Custom animations
- **Blockchain**: Stacks, Clarity smart contracts
- **Wallet**: @stacks/connect
- **Deployment**: Vercel

---

## 📁 Project Structure
```
base2stacks-tracker/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Main page
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Global styles
│   ├── hooks/
│   │   ├── useWallet.ts      # Wallet connection
│   │   ├── useContract.ts    # Contract interactions
│   │   └── useBalance.ts     # Balance tracking
│   └── components/
│       ├── TransactionHistory.tsx
│       └── StakingStats.tsx
├── contracts/
│   └── b2s-token.clar        # Smart contract
├── public/                   # Static assets
└── tests/                    # Contract tests
```

---
---

## 📊 New Features (v1.2.0)

### 🏆 Advanced Leaderboard
- **Top 10 Display** with real-time rankings
- **Badge System**: 👑 🥇 🔥 💎 ⭐
- **Detailed Stats**: Total staked, rewards earned
- **Filter Options**: Top 10, Top 50, All users
- **Live Updates**: Rankings refresh every 30 seconds

[📖 Leaderboard Documentation](docs/LEADERBOARD.md)

### 📊 APY Calculator
- **Interactive Inputs**: Stake amount and duration
- **Duration Presets**: 1 week to 1 year
- **Custom Sliders**: Fine-tune days and APY
- **Real-time Results**: Instant earnings calculation
- **Earnings Breakdown**: Daily, monthly, and total projections

[📖 Calculator Documentation](docs/APY-CALCULATOR.md)

**Try it live:** [Base2Stacks Tracker](https://wkalidev-base2stacks-tracker.vercel.app)

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 📜 License

MIT License - see [LICENSE](LICENSE)

---

## 👨‍💻 Author

**wkalidev** (zcodebase)

- Twitter: [@willycodexwar](https://twitter.com/willycodexwar)
- Farcaster: [willywarrior](https://warpcast.com/willywarrior)
- GitHub: [@wkalidev](https://github.com/wkalidev)

---

## 🏆 Built for Stacks Builder Rewards

This project was built for the Stacks Builder Rewards program (February 2026).

---

## 📈 Stats

- **Lines of Code**: 2000+
- **Components**: 8
- **Smart Contracts**: 1
- **Tests**: 5

---

Made with ❤️ by wkalidev(zcodebase) for the Stacks community