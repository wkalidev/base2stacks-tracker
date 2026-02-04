# 🚀 Quick Start Guide

Get Base2Stacks Tracker running locally in 5 minutes!

## Prerequisites

Make sure you have:
- Node.js 18+ installed
- npm or yarn
- Clarinet CLI (for smart contracts)

## Step 1: Clone & Install

```bash
# Clone the repository
git clone https://github.com/wkalidev/base2stacks-tracker.git
cd base2stacks-tracker

# Install dependencies
npm install
```

## Step 2: Environment Setup

```bash
# Copy environment example
cp .env.example .env.local

# Edit .env.local with your values
# For development, default values work fine
```

## Step 3: Test Smart Contracts

```bash
# Install Clarinet (if not already installed)
brew install clarinet  # macOS
# or download from: https://github.com/hirosystems/clarinet

# Run contract tests
clarinet test

# Check contract syntax
clarinet check
```

## Step 4: Run Development Server

```bash
# Start Next.js dev server
npm run dev

# Open browser to http://localhost:3000
```

You should see the Base2Stacks Tracker homepage! 🎉

## Step 5: Deploy Smart Contract (Optional)

### Testnet Deployment

```bash
# Deploy to Stacks testnet
clarinet deploy --testnet

# Note the contract address for .env.local
# NEXT_PUBLIC_CONTRACT_ADDRESS=ST...
```

### Mainnet Deployment (Production)

```bash
# Deploy to Stacks mainnet (requires STX)
clarinet deploy --mainnet
```

## Step 6: Deploy Frontend to Vercel

### Option A: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/wkalidev/base2stacks-tracker)

### Option B: CLI Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts...
```

## 🧪 Running Tests

```bash
# Smart contract tests
clarinet test

# Frontend tests (when added)
npm test

# Type checking
npm run type-check
```

## 🎨 Development Tips

### Hot Reload
Changes to `src/` files will auto-reload the browser.

### Smart Contract Changes
After modifying `.clar` files:
```bash
clarinet check      # Verify syntax
clarinet test       # Run tests
```

### Add New Components
```bash
# Create new component
mkdir src/components/MyComponent
touch src/components/MyComponent/index.tsx
```

### Styling
Use Tailwind utility classes:
```tsx
<div className="card-hover text-center">
  <h3 className="gradient-text">Title</h3>
</div>
```

## 🔧 Common Issues

### Port 3000 Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### Clarinet Not Found
```bash
# Install via Homebrew (macOS)
brew install clarinet

# Or download binary from GitHub
# https://github.com/hirosystems/clarinet/releases
```

### Contract Deploy Fails
- Make sure you have STX in your wallet
- Check network is correct (testnet vs mainnet)
- Verify contract syntax: `clarinet check`

## 📚 Next Steps

1. **Read the Docs**: Check out `/docs` folder
2. **Join Community**: Twitter, Discord, GitHub Discussions
3. **Contribute**: See [CONTRIBUTING.md](./CONTRIBUTING.md)
4. **Track Bridges**: Submit your first bridge transaction!
5. **Earn $B2S**: Claim daily rewards and track activity

## 🎯 Key Features to Try

- ✅ Connect Stacks wallet (Xverse, Leather)
- ✅ Track a bridge transaction
- ✅ Claim daily rewards
- ✅ Stake $B2S tokens
- ✅ View leaderboard and stats

## 🤝 Need Help?

- 📖 Full documentation: `/docs`
- 💬 GitHub Discussions: Ask questions
- 🐛 Bug reports: Open an issue
- 🐦 Twitter: [@willycodexwar](https://twitter.com/willycodexwar)

## 🏆 Stacks Builder Rewards

This project participates in Stacks Builder Rewards!
- **Period**: Feb 1-28, 2026
- **Prize**: 15,000 $STX
- **Your contributions count!**

---

**Ready to build? Let's go! 🚀**

Made with ❤️ by Wkalidev(zcodebase)