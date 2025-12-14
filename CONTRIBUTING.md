# Contributing to TruthLens

Thank you for your interest in contributing to TruthLens! 🎉

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guide](#style-guide)

## 📜 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- No harassment, discrimination, or inappropriate behavior

## 🚀 Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/TruthLens.git
   cd TruthLens
   ```
3. **Add upstream** remote:
   ```bash
   git remote add upstream https://github.com/boubli/TruthLens.git
   ```

## 🤝 How to Contribute

### Reporting Bugs
- Check if the bug is already reported in [Issues](https://github.com/boubli/TruthLens/issues)
- Use the **Bug Report** template
- Include steps to reproduce, expected vs actual behavior

### Suggesting Features
- Check the [Roadmap](README.md#-roadmap--future-plans) first
- Use the **Feature Request** template
- Explain the use case and benefits

### Code Contributions
1. **Open an issue first** for major changes
2. Pick issues labeled `good first issue` or `help wanted`
3. Comment on the issue to get assigned

## 🛠️ Development Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local
# Edit .env.local with your Firebase/API keys

# Run development server
npm run dev

# Run linting
npm run lint

# Build for production
npm run build
```

## 📝 Pull Request Process

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make your changes** following our [Style Guide](#style-guide)

3. **Commit** with conventional commit messages:
   ```bash
   git commit -m "feat: add new feature"
   git commit -m "fix: resolve bug description"
   git commit -m "docs: update documentation"
   ```

4. **Push** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open a Pull Request** against `main`

### PR Checklist
- [ ] Code follows the style guide
- [ ] Self-reviewed the code
- [ ] Added/updated tests if applicable
- [ ] Updated documentation if needed
- [ ] No secrets or API keys committed

## 🎨 Style Guide

### TypeScript
- Use TypeScript for all new code
- Define proper types (avoid `any`)
- Use interfaces for object shapes

### React/Next.js
- Use functional components with hooks
- Keep components small and focused
- Use `use client` directive when needed

### Naming Conventions
- **Files**: `PascalCase` for components, `camelCase` for utilities
- **Variables**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase`

### Code Quality
- Run `npm run lint` before committing
- No console.log in production code
- Handle errors appropriately

## ❓ Questions?

- Open a [Discussion](https://github.com/boubli/TruthLens/discussions)
- Tag maintainers in issues if needed

---

**Thank you for contributing!** 💚
