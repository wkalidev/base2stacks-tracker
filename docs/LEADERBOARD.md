# 🏆 Leaderboard System

## Overview

The Base2Stacks Leaderboard showcases the top stakers in the ecosystem, promoting competition and engagement.

---

## Features

### 🎯 Real-time Rankings
- **Top 10** - Elite stakers
- **Top 50** - Power users
- **All** - Complete leaderboard

### 🏅 Badges System

| Badge | Meaning | Requirement |
|-------|---------|-------------|
| 👑 | Rank #1 | First place |
| 🥇 | Gold Tier | Top 3 |
| 🥈 | Silver Tier | Rank 4-10 |
| 🥉 | Bronze Tier | Rank 11-50 |
| 🔥 | Hot Streak | 7+ days active |
| 💎 | Diamond Hands | 30+ days staked |
| ⭐ | Rising Star | New top 50 entry |
| ⚡ | Power Staker | 50K+ staked |

---

## How Rankings Work

### Calculation Formula
```
Score = (Total Staked × 0.7) + (Total Rewards × 0.3)
```

### Ranking Factors

1. **Total Staked** (70% weight)
   - Primary ranking factor
   - Updated in real-time

2. **Total Rewards** (30% weight)
   - Rewards earned over time
   - Includes daily claims + staking yields

3. **Tie-Breaker**
   - Join date (earlier = higher rank)

---

## Statistics

### Current Metrics

- **Total Stakers**: 892
- **Total Staked**: 15.2M $B2S
- **Average APY**: 12.5%
- **Top Staker**: 150K $B2S

### Distribution

| Tier | Stakers | % of Total |
|------|---------|------------|
| Top 10 | 10 | 1.1% |
| Top 50 | 50 | 5.6% |
| Top 100 | 100 | 11.2% |
| Others | 742 | 83.1% |

---

## API Integration

### Fetch Leaderboard Data
```typescript
async function fetchLeaderboard(limit: number = 10) {
  const response = await fetch(`/api/leaderboard?limit=${limit}`)
  return await response.json()
}
```

### Response Format
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "address": "SP1ABC...XYZ",
      "displayName": "CryptoWhale",
      "staked": 150000,
      "rewards": 18750,
      "badges": ["🥇", "🔥", "💎"],
      "joinDate": "2026-01-15"
    }
  ],
  "totalStakers": 892,
  "totalStaked": 15200000,
  "avgApy": 12.5
}
```

---

## Future Enhancements

### v1.3.0
- [ ] Live updates via WebSocket
- [ ] Personal rank widget
- [ ] Historical rank charts
- [ ] Achievements system

### v1.4.0
- [ ] Weekly/Monthly competitions
- [ ] Bonus rewards for top 10
- [ ] Social sharing
- [ ] NFT rewards for milestones

---

## Design Philosophy

- **Competitive** - Encourage staking
- **Fair** - Transparent ranking
- **Engaging** - Visual rewards
- **Real-time** - Live updates

---

Built for #StacksBuilderRewards 🏆