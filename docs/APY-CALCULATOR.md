# 📊 APY Calculator Documentation

## Overview

The APY Calculator helps users estimate their potential earnings from staking $B2S tokens.

---

## Features

### 🎯 Interactive Inputs

1. **Stake Amount**
   - Enter any amount in $B2S
   - Real-time calculation updates
   - No minimum or maximum limits

2. **Duration Presets**
   - 1 Week (7 days)
   - 1 Month (30 days)
   - 3 Months (90 days)
   - 6 Months (180 days)
   - 1 Year (365 days)

3. **Custom Duration**
   - Slider: 1 day to 2 years (730 days)
   - Precise day selection
   - Visual feedback

4. **APY Adjustment**
   - Range: 0% to 50%
   - Default: 12.5%
   - Step: 0.1%
   - Simulates different market conditions

---

## Calculation Formula

### Compound Interest
```
A = P(1 + r)^t

Where:
A = Final Amount
P = Principal (initial stake)
r = Annual interest rate (APY)
t = Time in years
```

### Earnings Breakdown
```typescript
Total Earnings = Final Amount - Principal
Daily Earnings = Total Earnings / Days
Monthly Earnings = Total Earnings / (Days / 30)
```

---

## Example Calculations

### Scenario 1: Short-term Staking

**Input:**
- Stake: 1,000 $B2S
- Duration: 30 days (1 month)
- APY: 12.5%

**Output:**
- Total Earnings: +10.52 $B2S
- Daily: +0.35 $B2S
- Monthly: +10.52 $B2S
- Final: 1,010.52 $B2S

### Scenario 2: Long-term Staking

**Input:**
- Stake: 10,000 $B2S
- Duration: 365 days (1 year)
- APY: 12.5%

**Output:**
- Total Earnings: +1,250 $B2S
- Daily: +3.42 $B2S
- Monthly: +102.74 $B2S
- Final: 11,250 $B2S

### Scenario 3: High APY

**Input:**
- Stake: 5,000 $B2S
- Duration: 180 days (6 months)
- APY: 25%

**Output:**
- Total Earnings: +625 $B2S
- Daily: +3.47 $B2S
- Monthly: +104.17 $B2S
- Final: 5,625 $B2S

---

## User Interface

### Components

1. **Input Section**
```tsx
   - Stake Amount Input (number)
   - Duration Presets (buttons)
   - Duration Slider (1-730 days)
   - APY Slider (0-50%)
```

2. **Results Section**
```tsx
   - Total Earnings (highlighted)
   - Daily Earnings
   - Monthly Earnings
   - Initial → Final Balance
```

3. **Info Note**
   - Disclaimer about assumptions
   - Network conditions notice

---

## Technical Implementation

### State Management
```typescript
const [stakeAmount, setStakeAmount] = useState<string>('1000')
const [stakeDuration, setStakeDuration] = useState<number>(365)
const [apy, setApy] = useState<number>(12.5)
```

### Real-time Calculation
```typescript
const calculateEarnings = () => {
  const principal = parseFloat(stakeAmount) || 0
  const years = stakeDuration / 365
  const rate = apy / 100
  
  const totalAmount = principal * Math.pow(1 + rate, years)
  const earnings = totalAmount - principal
  
  return {
    earnings: earnings.toFixed(2),
    dailyEarnings: (earnings / stakeDuration).toFixed(2),
    monthlyEarnings: (earnings / (stakeDuration / 30)).toFixed(2)
  }
}
```

---

## Use Cases

### 1. Pre-Staking Planning
Users can explore different scenarios before committing funds.

### 2. ROI Comparison
Compare staking returns with other DeFi opportunities.

### 3. Goal Setting
Calculate how much to stake to reach earnings targets.

### 4. Education
Help newcomers understand compound interest.

---

## Future Enhancements

### v1.3.0
- [ ] Historical APY data
- [ ] Chart visualization
- [ ] Multiple token support
- [ ] Tax calculation

### v1.4.0
- [ ] Save calculations
- [ ] Share results
- [ ] Compare scenarios side-by-side
- [ ] Mobile app widget

---

## Important Notes

⚠️ **Disclaimer**: 
- Calculations assume constant APY
- Actual earnings may vary
- Network conditions affect results
- Not financial advice

💡 **Best Practices**:
- Start with conservative APY estimates
- Factor in potential APY fluctuations
- Consider lock-up periods
- Diversify staking strategies

---

Built for #StacksBuilderRewards 🏆