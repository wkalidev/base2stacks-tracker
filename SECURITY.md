# Security Policy

## Supported Versions

Currently supported versions of Base2Stacks Tracker:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within Base2Stacks Tracker, please follow these steps:

### Contact

- **Email**: Create an issue with the "security" label (do NOT include sensitive details in public issues)
- **Response Time**: We aim to respond within 48 hours
- **Disclosure**: Please allow us time to fix the issue before public disclosure

### What to Include

Please provide:
- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact assessment
- Affected versions
- Suggested fix (if any)

## Security Best Practices

### For Users

When using Base2Stacks Tracker:

1. **Wallet Security**
   - Never share your seed phrase or private keys
   - Only use official wallet extensions (Leather, Xverse)
   - Verify all transaction details before signing
   - Double-check contract addresses

2. **Network Safety**
   - Start with testnet before using mainnet
   - Verify you're on the correct network
   - Be cautious of phishing attempts

3. **Software Updates**
   - Keep your wallet software updated
   - Use the latest version of browsers
   - Enable security features in your wallet

### For Developers

When contributing:

1. **Code Security**
   - Never commit private keys or secrets
   - Use environment variables for sensitive data
   - Review code for vulnerabilities before PR
   - Follow secure coding practices

2. **Dependencies**
   - Keep dependencies updated
   - Audit third-party packages
   - Use lockfiles (package-lock.json)

## Smart Contract Security

### Audits

Our smart contract has been:
- ✅ Manually reviewed by core team
- ✅ Tested extensively on Stacks testnet
- ✅ Deployed with security best practices
- ⏳ Professional audit: Planned

### Contract Details

- **Network**: Stacks Testnet
- **Contract Address**: `ST936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96.b2s-token`
- **Language**: Clarity
- **Source**: Available in [b2s-token-contract](https://github.com/wkalidev/b2s-token-contract) repo

### Known Limitations

- Currently deployed on testnet only
- Limited to testnet tokens (no real value)
- Rate limiting on daily claims (24 hours)

## Incident Response

In case of a security incident:

1. **Immediate Action**: Issue will be addressed immediately
2. **Communication**: Users notified via GitHub and social media
3. **Fix Deployment**: Patch deployed ASAP
4. **Post-Mortem**: Detailed report published after resolution

## Security Updates

Security updates are released as soon as possible. Users will be notified through:
- GitHub releases
- Repository README
- Social media channels

## Acknowledgments

We appreciate security researchers who help keep our project safe. Responsible disclosure is greatly appreciated.

---

**Last Updated**: February 8, 2026
**Version**: 1.2.0