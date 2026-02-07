# Contributing to Base2Stacks Bridge Tracker

Thank you for your interest in contributing! 🎉

This project is part of the **Stacks Builder Rewards** program. Your contributions help us climb the leaderboard and earn $STX rewards!

## 🚀 Quick Start

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR-USERNAME/base2stacks-tracker.git`
3. **Create a branch**: `git checkout -b feature/amazing-feature`
4. **Make changes** and commit: `git commit -m 'Add amazing feature'`
5. **Push** to your fork: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

## 🎯 Ways to Contribute

### Code Contributions
- ✨ **New Features**: Add functionality to improve tracking or rewards
- 🐛 **Bug Fixes**: Fix issues and improve stability
- 🎨 **UI/UX**: Enhance the user interface and experience
- ⚡ **Performance**: Optimize code for better performance
- 📱 **Mobile**: Improve mobile responsiveness

### Documentation
- 📝 **Guides**: Write tutorials and how-to guides
- 📚 **API Docs**: Document smart contract functions
- 🌍 **Translations**: Translate docs to other languages
- 💡 **Examples**: Create example implementations

### Testing
- 🧪 **Unit Tests**: Add tests for smart contracts
- 🔍 **Integration Tests**: Test frontend-contract interactions
- 🐞 **Bug Reports**: Report issues with detailed steps

### Community
- 💬 **Discussions**: Participate in GitHub Discussions
- ⭐ **Star**: Star the repo to show support
- 📢 **Share**: Share the project on social media
- 🤝 **Review**: Review and test pull requests

## 📋 Development Guidelines

### Code Style

**TypeScript/JavaScript:**
```typescript
// Use meaningful variable names
const bridgeTransaction = await trackBridge(...)

// Add comments for complex logic
// Calculate rewards based on verification status
const rewards = verified ? BASE_REWARD * 2 : BASE_REWARD

// Use async/await instead of .then()
const result = await contract.call(...)
```

**Clarity (Smart Contracts):**
```clarity
;; Use descriptive function names
(define-public (track-bridge-transaction ...)
  ;; Comment complex logic
  ;; Verify transaction hasn't been tracked before
  (asserts! (is-none (map-get? transactions { tx-hash: hash })) err-already-tracked)
  ...
)
```

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: add staking rewards calculation
fix: resolve wallet connection issue
docs: update API documentation
style: format code with prettier
test: add tests for bridge tracking
refactor: simplify reward distribution logic
perf: optimize transaction fetching
chore: update dependencies
```

### Pull Request Process

1. **Update documentation** if you add/change features
2. **Add tests** for new functionality
3. **Ensure tests pass**: `npm test` or `clarinet test`
4. **Update README** if needed
5. **Link related issues** in PR description

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement

## Testing
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] Manually tested

## Screenshots (if applicable)

## Related Issues
Fixes #123
```

## 🧪 Testing

### Frontend Tests
```bash
npm test
```

### Smart Contract Tests
```bash
clarinet test
clarinet check
```

### Local Development
```bash
npm install
npm run dev
# Open http://localhost:3000
```

## 🏗️ Project Structure

```
base2stacks-tracker/
├── contracts/          # Clarity smart contracts
│   ├── b2s-token.clar
│   └── ...
├── src/
│   ├── app/           # Next.js pages
│   ├── components/    # React components
│   ├── lib/          # Utilities
│   └── hooks/        # Custom hooks
├── tests/            # Contract tests
├── public/           # Static assets
└── docs/             # Documentation
```

## 🎨 Design Guidelines

- Use **Tailwind CSS** utility classes
- Follow **mobile-first** approach
- Maintain **accessibility** standards (ARIA labels, keyboard navigation)
- Use **consistent spacing** (4px, 8px, 16px, 24px, 32px)
- Keep **color palette** consistent with brand

## 🔐 Security

- **Never** commit private keys or sensitive data
- **Always** validate user input in smart contracts
- **Test** security-critical functions thoroughly
- **Report** security issues privately to maintainers

## 📊 Stacks Builder Rewards Impact

Every contribution helps us in the Stacks Builder Rewards program:

✅ **GitHub Activity**: Commits, PRs, and reviews count toward the leaderboard  
✅ **Smart Contract Usage**: Deployed contracts generate fees  
✅ **Community Growth**: More users = more activity = higher ranking

## 🤔 Questions?

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and ideas
- **Twitter**: [@willywarrior](https://twitter.com/willywarrior)
- **Discord**: Comming soon

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Contributors

Thanks to all contributors! ⭐

<a href="https://github.com/zcodebase/base2stacks-tracker/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=zcodebase/base2stacks-tracker" />
</a>

---

**"Together we bridge, together we build."** 🌉

Made with ❤️ by wkalidev(zcodebase) for the Stacks and Base communities.
