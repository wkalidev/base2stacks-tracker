# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x.x   | :white_check_mark: |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within Base2Stacks Tracker, please follow these steps:

### Contact

- **GitHub**: Open an issue with the "security" label (do NOT include sensitive details in public issues)
- **Twitter**: [@willycodexwar](https://twitter.com/willycodexwar) (DM for critical issues)
- **Response Time**: We aim to respond within 48 hours
- **Disclosure**: Please allow us time to fix the issue before public disclosure

### What to Include

Please provide:
- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact assessment
- Affected versions
- Suggested fix (if any)

---

## Security Best Practices

### For Users

1. **Wallet Security**
   - Never share your seed phrase or private keys
   - Only use official wallet extensions (Leather, Xverse)
   - Verify all transaction details before signing
   - Double-check contract addresses — our mainnet address is `SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96`

2. **Network Safety**
   - We are on **Stacks mainnet** — transactions have real value
   - Verify you're on the correct network before signing
   - Be cautious of phishing attempts and fake URLs
   - Official app: **https://base2stacks-tracker.vercel.app**

3. **Software Updates**
   - Keep your wallet software updated
   - Use the latest version of your browser
   - Enable security features in your wallet

### For Developers

1. **Code Security**
   - Never commit private keys or secrets
   - Use environment variables for sensitive data (see `.env.example`)
   - Review code for vulnerabilities before submitting a PR
   - Follow secure coding practices

2. **Dependencies**
   - Keep dependencies updated
   - Audit third-party packages with `npm audit`
   - Use lockfiles (`package-lock.json`)

---

## Smart Contract Security

### Audits

| Contract | Status |
|---|---|
| `b2s-token` | ✅ Manually reviewed |
| `b2s-token-v4` | ✅ Clarity 4, reviewed |
| `b2s-liquidity-pool-v5` | ✅ Active liquidity, reviewed |
| `b2s-liquidity-pool-v6` | ✅ Reviewed |
| `b2s-staking-vault-v2` | ✅ Reviewed |
| `b2s-governance` | ✅ Reviewed |
| `b2s-fee-router` | ✅ Reviewed |
| `b2s-prediction-market` | ✅ Reviewed |
| Professional audit | ⏳ Planned |

### Contract Details (Mainnet)

- **Network**: Stacks **Mainnet**
- **Deployer**: `SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96`
- **Language**: Clarity 4
- **Explorer**: [View on Hiro Explorer](https://explorer.hiro.so/address/SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96?chain=mainnet)
- **Source**: [b2s-token-contract](https://github.com/wkalidev/b2s-token-contract)

### Known Limitations

- Daily claim rate limiting: 24 hours between claims
- Governance requires 10,000 $B2S staked to create proposals
- NFT marketplace charges 2.5% platform fee on all sales

---

## Incident Response

In case of a security incident:

1. **Immediate Action**: Issue addressed immediately, contracts paused if needed
2. **Communication**: Users notified via GitHub, Twitter, and Farcaster
3. **Fix Deployment**: Patch deployed ASAP with new contract version if required
4. **Post-Mortem**: Detailed report published after resolution

---

## Acknowledgments

We appreciate security researchers who help keep our project safe. Responsible disclosure is greatly appreciated.

---

**Last Updated**: March 11, 2026
**Version**: 2.0.0