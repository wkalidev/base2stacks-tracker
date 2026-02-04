# 🌉 Base2Stacks Bridge Tracker

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Stacks](https://img.shields.io/badge/Stacks-Blockchain-orange.svg)
![Base](https://img.shields.io/badge/Base-Network-blue.svg)

**Track cross-chain activity between Base Network and Stacks Blockchain in real-time.**

Earn **$B2S tokens** for tracking bridge transactions, providing liquidity insights, and contributing to cross-chain transparency.

---

## 🎯 Features

- ✅ Real-time bridge transaction tracking
- ✅ Cross-chain analytics dashboard
- ✅ $B2S token rewards for active trackers
- ✅ Historical data & trend analysis
- ✅ Community-driven price oracle
- ✅ NFT badges for top contributors

---

## 💰 $B2S Token

**Total Supply:** 1,000,000,000 $B2S

### Distribution:
- 40% - Community Rewards (tracking activity)
- 25% - Liquidity Pool
- 20% - Development Fund
- 10% - Marketing & Partnerships
- 5% - Team (12-month vesting)

### Utility:
- Stake to earn tracking fees
- Governance voting rights
- Premium analytics access
- NFT badge minting
- Cross-chain fee discounts

---

## 🛠️ Tech Stack

### Smart Contracts
- **Clarity** (Stacks native language)
- **Clarinet** (Testing framework)
- **Hiro Platform** (Deployment)

### Frontend
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **@stacks/connect** (Wallet integration)
- **@stacks/transactions** (Blockchain interaction)
- **Recharts** (Data visualization)

### Backend
- **Base RPC** (Base Network data)
- **Stacks API** (Stacks data)
- **Vercel** (Hosting)

---

## 🚀 Quick Start

### Prerequisites
```bash
node >= 18.x
npm >= 9.x
clarinet >= 1.7.x
```

### Installation

```bash
# Clone repository
git clone https://github.com/wkalidev/base2stacks-tracker.git
cd base2stacks-tracker

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local

# Run development server
npm run dev
```

### Deploy Smart Contract

```bash
# Test contract
clarinet test

# Deploy to testnet
clarinet deploy --testnet

# Deploy to mainnet
clarinet deploy --mainnet
```

---

## 📁 Project Structure

```
base2stacks-tracker/
├── contracts/              # Clarity smart contracts
│   ├── b2s-token.clar     # $B2S fungible token
│   ├── bridge-tracker.clar # Bridge tracking logic
│   └── rewards-pool.clar   # Staking & rewards
├── src/
│   ├── app/               # Next.js app directory
│   ├── components/        # React components
│   ├── lib/              # Utilities & helpers
│   └── hooks/            # Custom React hooks
├── tests/                # Contract tests
├── public/               # Static assets
└── docs/                 # Documentation
```

---

## 🎮 How It Works

### 1. **Track Bridges**
Users submit bridge transaction data (Base → Stacks or Stacks → Base)

### 2. **Earn Rewards**
Validators verify transactions and earn $B2S tokens

### 3. **Stake & Govern**
Stake $B2S to participate in governance and earn staking rewards

### 4. **Analytics**
Access premium cross-chain analytics and insights

---

## 🔗 Bridge Data Sources

- **Base Network**: JSON-RPC, Subgraph, Basescan API
- **Stacks Blockchain**: Stacks API, Hiro API, Explorer
- **Cross-chain Events**: Custom indexer for bridge contracts

---

## 🏆 Roadmap

### Phase 1 (Feb 2026) - MVP
- [x] $B2S token contract
- [x] Basic tracking interface
- [ ] Wallet integration
- [ ] Deploy testnet

### Phase 2 (Mar 2026) - Enhancement
- [ ] Advanced analytics
- [ ] Staking mechanism
- [ ] NFT badges
- [ ] Mobile responsive

### Phase 3 (Apr 2026) - Expansion
- [ ] Multi-chain support (Optimism, Arbitrum)
- [ ] API for developers
- [ ] DAO governance
- [ ] Mainnet launch

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Flow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📊 Stacks Builder Rewards

This project participates in **Stacks Builder Rewards** program!

- **Period**: February 1-28, 2026
- **Prize Pool**: 15,000 $STX / month
- **Tracked Activity**: GitHub commits + smart contract usage

Help us climb the leaderboard by:
- ⭐ Star this repository
- 🔧 Contribute code
- 📝 Improve documentation
- 🐛 Report issues
- 💬 Share with community

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details

---

## 👤 Author

**Willy Warrior** (zcodebase)
- Twitter: [@willycodexwar](https://twitter.com/willycodexwar)
- GitHub: [@wkalidev](https://github.com/wkalidev)
- Farcaster: @willywarrior

---

## 🔗 Links

- [Website](https://base2stacks-tracker.vercel.app)
- [Documentation](./docs)
- [Stacks Explorer](https://explorer.stacks.co)
- [Base Network](https://base.org)
- [Discord Community](#)

---

## 🙏 Acknowledgments

Built with ❤️ for the Base and Stacks communities.

Special thanks to:
- Stacks Foundation
- Base Network team
- Open source contributors
- Early adopters

---

**"Bridging two worlds, one transaction at a time."** 🌉
