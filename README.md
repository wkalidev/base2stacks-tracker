# $B2S Token Smart Contract

Official Clarity smart contracts for the Base2Stacks Bridge Tracker ecosystem — deployed on **Stacks Mainnet**.

[![Mainnet](https://img.shields.io/badge/Deployed-Stacks%20Mainnet-green)](https://explorer.hiro.so/address/SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96?chain=mainnet)
[![Language](https://img.shields.io/badge/Language-Clarity-blue)](https://clarity-lang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](./LICENSE)
[![Builder Rewards](https://img.shields.io/badge/Stacks-Builder%20Rewards%202026-orange)](https://stacks.org)

## 📋 Overview

The $B2S token powers the Base2Stacks DeFi ecosystem with:

- Daily reward claims (5 $B2S per day)
- Staking mechanism (12.5% APY)
- AMM Liquidity Pool with B2S ↔ STX swaps
- Rewards distribution system
- **Prediction Market** (Price / Stacks / Governance / Sport / Crisis Alert)
- Anti-spam protection (24h cooldown)

## 📦 Smart Contracts (Mainnet)

| Contract | Address | Explorer |
|---|---|---|
| `b2s-token` | `SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96.b2s-token` | [View](https://explorer.hiro.so/address/SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96.b2s-token?chain=mainnet) |
| `b2s-liquidity-pool-v5` | `SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96.b2s-liquidity-pool-v5` | [View](https://explorer.hiro.so/address/SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96.b2s-liquidity-pool-v5?chain=mainnet) |
| `b2s-rewards-distributor-v3` | `SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96.b2s-rewards-distributor-v3` | [View](https://explorer.hiro.so/address/SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96.b2s-rewards-distributor-v3?chain=mainnet) |
| `b2s-prediction-market` | `SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96.b2s-prediction-market` | [View](https://explorer.hiro.so/address/SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96.b2s-prediction-market?chain=mainnet) |

## 🌐 Live App

**[https://base2stacks-tracker.vercel.app](https://base2stacks-tracker.vercel.app)**

## 💡 Features

### 1. Daily Rewards
```clarity
(claim-daily-reward)
```
- Claims 5 $B2S tokens per day
- 24-hour cooldown between claims
- Automatic balance update

### 2. Staking System
```clarity
(stake (amount uint))
(unstake (amount uint))
```
- Stake tokens to earn 12.5% APY
- Minimum: 1 $B2S token
- No lock period — flexible unstaking

### 3. AMM Liquidity Pool
```clarity
(swap-b2s-for-stx (amount uint) (min-out uint))
(swap-stx-for-b2s (amount uint) (min-out uint))
(add-liquidity (b2s-amount uint) (stx-amount uint) (min-lp uint))
```
- Uniswap v2-style AMM (x*y=k)
- 0.25% swap fee
- LP token rewards

### 4. Rewards Distributor
```clarity
(stake (amount uint))
(unstake (amount uint))
(claim-rewards)
```
- Continuous rewards at 12.5% APY
- Real-time pending rewards tracking
- Instant claim at any time

### 5. Prediction Market
```clarity
(create-market (question (string-utf8 256)) (category (string-ascii 32)) (deadline-blocks uint))
(place-bet (market-id uint) (vote bool) (amount uint))
(resolve-market (market-id uint) (outcome bool))
(claim-winnings (market-id uint))
```
- 5 categories: Price / Stacks / Governance / Sport / Crisis Alert
- AMM-style odds based on bet pool
- 2% platform fee on winnings
- Emergency refund after deadline + 1000 blocks

## 🏗️ Contract Structure

```
contracts/
├── b2s-token.clar                  # SIP-010 fungible token
├── b2s-liquidity-pool.clar         # AMM pool v5
├── b2s-rewards-distributor.clar    # Staking & rewards v3
├── b2s-prediction-market.clar      # Prediction market
└── b2s-governance.clar             # DAO governance
```

## 📊 Token Economics

| Metric | Value |
|---|---|
| Standard | SIP-010 |
| Daily Rewards | 5 $B2S / user |
| Staking APY | 12.5% |
| Swap Fee | 0.25% |
| Prediction Fee | 2% |
| Decimals | 6 |

## 🔐 Security Features

- ✅ Balance overflow protection
- ✅ Anti-spam cooldown mechanism
- ✅ Input validation on all functions
- ✅ Principal-based authentication
- ✅ Slippage protection on swaps
- ✅ Emergency refund mechanism

## 🛠️ Local Development

### Prerequisites
- [Clarinet](https://github.com/hirosystems/clarinet)
- Node.js 18+
- Stacks wallet (Leather / Xverse)

### Setup
```bash
git clone https://github.com/wkalidev/b2s-token-contract.git
cd b2s-token-contract
clarinet check
```

### Run Tests
```bash
clarinet test
```

### Deploy (Mainnet)
```bash
# Add MNEMONIC to .env
node deploy.js
```

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📜 License

MIT License — See [LICENSE](./LICENSE)

## 🔗 Links

- 🌐 [Live App](https://base2stacks-tracker.vercel.app)
- 📊 [Explorer — Deployer Address](https://explorer.hiro.so/address/SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96?chain=mainnet)
- 🐦 [Twitter](https://twitter.com/willycodexwar)
- 🟪 [Farcaster](https://warpcast.com/willywarrior)
- 🏆 [Stacks Builder Rewards](https://stacks.org)

---

**Built with ❤️ by [Wkalidev (zcodebase)](https://github.com/wkalidev) — #StacksBuilderRewards March 2026 🏆**