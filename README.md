# Base2Stacks Tracker

[![Mainnet](https://img.shields.io/badge/Network-Stacks%20Mainnet-green?style=for-the-badge)](https://explorer.hiro.so/?chain=mainnet)
[![Next.js](https://img.shields.io/badge/Built%20with-Next.js%2016-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](./LICENSE)
[![Builder Rewards](https://img.shields.io/badge/Stacks-Builder%20Rewards%20May%202026-orange?style=for-the-badge)](https://stacks.org)

## Live App

**[https://base2stacks-tracker.vercel.app](https://base2stacks-tracker.vercel.app)**

Full DeFi platform on Stacks mainnet — swap, stake, bridge, govern, and bet. Powered by real on-chain data.

---

## MCP Server

**Endpoint:** `https://base2stacks-tracker.vercel.app/api/mcp`

Compatible with Claude, Cursor, and any MCP client.

| Tool | Description |
|------|-------------|
| `get_b2s_stats` | Live $B2S token price, supply, holders, market data |
| `get_staking_info` | APY tiers (12.5% / 25% / 37.5%), TVL, lock durations |
| `get_bridge_routes` | Bridge routes Base → Stacks with fees and times |
| `get_swap_quote` | Swap quote for STX/B2S/USDCx (0.25% AMM fee) |
| `get_leaderboard` | Top stakers and earners on Base2Stacks |
| `get_nft_badges` | 567-badge collection info across 3 series |

**MCP Discovery (GET):** Returns tool list, contract addresses, server version.

---

## A2A Agent Card

**Endpoint:** `https://base2stacks-tracker.vercel.app/api/agent-card`
**Well-known:** `https://base2stacks-tracker.vercel.app/.well-known/agent-card.json`

| Skill | Description |
|-------|-------------|
| `swap` | AMM swap STX/B2S/USDCx with 0.25% fee |
| `stake` | Stake $B2S for 12.5% to 37.5% APY |
| `bridge` | Bridge tokens between Base and Stacks |
| `governance` | Vote on proposals with staked $B2S |
| `nft_badges` | Buy/sell 567 unique NFT badges |
| `portfolio` | Real-time balances and positions on Stacks |
| `prediction` | Bet on real-world outcomes |

---

## Smart Contracts

**Owner:** `SP1V72500C63KN9E348QDK9X879MASSTN0J3KBQ5N`

| Contract | Purpose |
|----------|---------|
| `b2s-token-v4` | SIP-010 $B2S token, 6 decimals, 10M max supply |
| `b2s-staking-vault-v2` | Staking, 12.5%–37.5% APY, lock multipliers |
| `b2s-staking-vault-v3` | Latest staking vault |
| `b2s-liquidity-pool-v6` | AMM, 0.25% fee, STX/B2S + USDCx pairs |
| `b2s-governance` | DAO voting, 10K B2S to propose, 7-day periods |
| `b2s-prediction-market` | AMM-style prediction markets, 5 categories, 2% fee |
| `b2s-price-oracle` | On-chain price feeds |
| `b2s-fee-router` | Bridge fee collection, 0.3% — 50% treasury/50% stakers |
| `b2s-rewards-distributor-v3` | Daily reward distribution |
| `b2s-airdrop` | Token airdrop distribution |
| `b2s-marketplace` | NFT badge marketplace, 2.5% fee |

---

## Features

### Wallet & Rewards
- Connect with Leather or Xverse
- Claim 5 $B2S daily rewards on-chain
- Real-time balance tracking from Stacks mainnet

### Live Market Data
- STX/USD price via CoinGecko, auto-refresh 60s
- TradingView Advanced Chart — candlesticks, RSI, MACD
- Market cap, volume, ATH, circulating supply

### AMM & Swaps
- STX/B2S/USDCx swaps, 0.25% fee
- Constant product formula (x*y=k)
- LP token minting, configurable slippage

### Staking
- 12.5% base APY (flexible), 25% (70 days), 37.5% (365 days)
- Real-time pending rewards from on-chain vault
- Compound daily

### Cross-Chain Bridge
- Routes: Stargate, deBridge, Across, Celer, Orbiter, Rango, Jupiter
- 0.3% on-chain fee recorded via `b2s-fee-router`

### Governance DAO
- On-chain proposals and voting
- 1 staked B2S = 1 vote, 7-day periods, quorum enforcement

### NFT Badges
- 567 unique badges — Infosec (#1–170), Glitch Art (#201–500), Galactic (#501–600)
- 5 rarity tiers: Common → Legendary
- IPFS via Pinata, multi-gateway fallback

### Prediction Market
- 5 categories: Price / Stacks / Governance / Sport / Crisis Alert
- AMM-style odds, 2% platform fee

### AI DeFi Assistant
- Powered by Claude Haiku (Anthropic)
- Natural language DeFi queries, market analysis
- Streaming responses

---

## Builder Rewards Checklist

- [x] Deployed on Stacks mainnet
- [x] SIP-010 fungible token ($B2S)
- [x] Multiple Clarity smart contracts (11 total)
- [x] Live app with wallet connection (Leather + Xverse)
- [x] AI agent with MCP server (6 tools)
- [x] A2A agent card with 7 skills
- [x] On-chain governance (DAO voting)
- [x] Cross-chain bridge integration
- [x] NFT marketplace (567 assets on IPFS)
- [x] npm package: `@wkalidev/b2s-contracts`
- [x] Social sharing (Twitter + Farcaster)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS |
| Blockchain | Stacks, Clarity 2 |
| Wallet | @stacks/connect v8 |
| Blockchain API | Hiro Mainnet API |
| Market Data | CoinGecko API |
| Charts | TradingView Advanced Chart |
| NFT Storage | Pinata IPFS |
| AI Agent | Claude Haiku (Anthropic) |
| Deployment | Vercel |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Contract owner address |
| `NEXT_PUBLIC_CONTRACT_NAME` | Primary contract name |
| `NEXT_PUBLIC_NETWORK` | `mainnet` |
| `NEXT_PUBLIC_STACKS_API_URL` | Hiro API base URL |
| `NEXT_PUBLIC_BASE_RPC_URL` | Base network RPC |
| `COINGECKO_API_KEY` | CoinGecko API key (server-side) |
| `ANTHROPIC_API_KEY` | Anthropic API key for B2S Agent (server-side) |

---

## Quick Start

```bash
git clone https://github.com/wkalidev/base2stacks-tracker.git
cd base2stacks-tracker
npm install
cp .env.example .env.local  # fill in your keys
npm run dev
```

---

## Related Projects

- [Stacks Quest](https://stacks-quest-ten.vercel.app) — Daily blockchain puzzle game + DeFi agent
- [@wkalidev/b2s-contracts](https://www.npmjs.com/package/@wkalidev/b2s-contracts) — npm SDK
- [b2s-nft-badges](https://github.com/wkalidev/b2s-nft-badges) — 567 NFT badge assets

---

**Built by [wkalidev (zcodebase)](https://github.com/wkalidev) for Stacks Builder Rewards 2026**
