# 🚀 Quick Start Guide

Get Base2Stacks Tracker running locally in 5 minutes!

## Prerequisites

- Node.js 18+
- npm or yarn
- Leather or Xverse wallet
- Clarinet CLI (optional — only for contract development)

## Step 1: Clone & Install

```bash
git clone https://github.com/wkalidev/base2stacks-tracker.git
cd base2stacks-tracker
npm install
```

## Step 2: Environment Setup

```bash
cp .env.example .env.local
```

Default values work out of the box — no API keys required.

```bash
# .env.local (all optional)
NEXT_PUBLIC_CONTRACT_ADDRESS=SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96
NEXT_PUBLIC_CONTRACT_NAME=b2s-token
NEXT_PUBLIC_BASE_URL=https://base2stacks-tracker.vercel.app
```

## Step 3: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see the Base2Stacks app. 🎉

## Step 4: Deploy Frontend to Vercel

### Option A: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/wkalidev/base2stacks-tracker)

### Option B: CLI Deploy

```bash
npm i -g vercel
vercel
```

Live app: **[https://base2stacks-tracker.vercel.app](https://base2stacks-tracker.vercel.app)**

---

## 🔧 Smart Contract Development (Optional)

All contracts are already deployed on **Stacks mainnet** at `SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96`.

If you want to modify or redeploy contracts locally:

```bash
# Install Clarinet
brew install clarinet  # macOS
# or: https://github.com/hirosystems/clarinet/releases

# Check contract syntax
clarinet check

# Run contract tests
clarinet test

# Deploy to mainnet (requires STX)
clarinet deploy --mainnet
```

Contracts are in the [b2s-token-contract](https://github.com/wkalidev/b2s-token-contract) repo.

---

## 🧪 Running Tests

```bash
# Type checking
npm run type-check

# Build check
npm run build

# Lint
npm run lint

# Contract tests
clarinet test
```

---

## 🔧 Common Issues

### Port 3000 already in use
```bash
lsof -ti:3000 | xargs kill -9
# or
PORT=3001 npm run dev
```

### Wallet not connecting
- Make sure Leather or Xverse extension is installed
- Confirm wallet is set to **Stacks Mainnet**
- Try refreshing the page

### Build errors
```bash
rm -rf .next node_modules
npm install
npm run build
```

---

## 🎯 Key Features to Try

- ✅ Connect wallet (Leather / Xverse)
- ✅ Claim 5 $B2S daily rewards
- ✅ Swap B2S ↔ STX in the liquidity pool
- ✅ Stake $B2S for 12.5% APY
- ✅ Browse 567 NFT badges (3 series)
- ✅ Vote on governance proposals
- ✅ Place predictions on the market
- ✅ Bridge via 7 cross-chain bridges

---

## 📚 Next Steps

1. **Docs**: Check the `/docs` folder
2. **Contracts**: See [b2s-token-contract](https://github.com/wkalidev/b2s-token-contract)
3. **NFT Badges**: See [b2s-nft-badges](https://github.com/wkalidev/b2s-nft-badges)
4. **Contribute**: See [CONTRIBUTING.md](./CONTRIBUTING.md)

## 🤝 Need Help?

- 🐦 Twitter: [@willycodexwar](https://twitter.com/willycodexwar)
- 🟪 Farcaster: [@willywarrior](https://warpcast.com/willywarrior)
- 🐛 Bugs: [Open an issue](https://github.com/wkalidev/base2stacks-tracker/issues)

---

**Ready to build? Let's go! 🚀**

Made with ❤️ by wkalidev(zcodebase) — #StacksBuilderRewards March 2026