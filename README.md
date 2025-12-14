
<p align="center">
  <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Food/Green%20Salad.png" alt="TruthLens Logo" width="120" />
</p>

<h1 align="center">TruthLens 🔍🥗</h1>

<p align="center">
  <strong>The Ultimate AI-Powered Nutrition Assistant</strong>
</p>

<p align="center">
  <a href="https://truth-lens-plum.vercel.app/">
    <img src="https://img.shields.io/badge/🚀_Live_Demo-TruthLens-blue?style=for-the-badge&logo=vercel" alt="Live Demo" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Firebase-Powered-orange?style=flat-square&logo=firebase" alt="Firebase" />
  <img src="https://img.shields.io/badge/AI-Groq_%7C_Gemini_%7C_Ollama-purple?style=flat-square&logo=openai" alt="AI Powered" />
  <img src="https://img.shields.io/badge/License-AGPL--3.0-green?style=flat-square" alt="License" />
</p>

---

**TruthLens** isn't just a calorie counter. It's an intelligent nutrition companion that helps you "see the truth" behind the food you eat.

Built as a modern **Progressive Web App (PWA)**, it combines the power of cloud AI (Groq, Gemini) with self-hosted privacy (Ollama, SearXNG) to instantly analyze products, decode ingredients, and generate personalized health quests.

## 🌟 Key Features

### 🥗 Smart Food Analysis
*   **🔎 Instant Grading**: Our proprietary **Smart Grade** algorithm evaluates products from **A (Excellent)** to **E (Avoid)** based on ingredients, processing, and nutrition.
*   **🧪 Ingredient Decoder**: Instantly identifies harmful additives, allergens, and hidden sugars.
*   **📷 Scanner v2**: Built on **Native Barcode Detection API** (Android/iOS) for instant, 60fps scanning. Features zero-lag redirection, continuous focus, and offline-first detection.

### 🤖 "AI Swarm v2" Intelligence
TruthLens uses a unique **AI Swarm** architecture to race multiple AI providers:
*   **Self-Hosted Power**: Defaults to your own **Azure VM (Llama 3.2)** for fast, private, and unlimited inference.
*   **Cloud Fallback**: Seamlessly switches to **Groq (Llama 3)** or **Gemini 1.5** for complex reasoning.
*   **Context-Aware**: The `/ai-chat` remembers your dietary preferences and health goals.

### 💎 Flexible & Lifetime Access
*   **Fair Pricing**: Monthly subscriptions or a unique **Lifetime Deal**.
*   **Tiered Features**:
    *   **Explorer (Free)**: 
        - Basic AI (Azure Ollama - completely free, no key needed)
        - **AI Chat**: Available with **Bring Your Own Key (BYOK)** for Groq/Gemini
        - 10 messages/day with your own API key
        - Basic product scanner (5 scans/day)
        - Limited history (10 items)
    *   **Plus ($4.99/mo)**: 
        - Everything in Free
        - **Platform AI keys included** (no BYOK needed)
        - 20 scans/day
        - Global search enabled
    *   **Pro ($9.99/mo)**: 
        - Unlimited scans & AI chat
        - All premium AI models included
        - Visual search & meal planning
        - PC Builder access
        - Priority support
    *   **Ultimate ($19.99/mo)**: 
        - All Pro features
        - White label reports
        - Beta access to new features

> **💡 Tip for Free Users**: You can use AI Chat by adding your own free API keys from [Groq](https://console.groq.com/keys) or [Google AI Studio](https://aistudio.google.com/app/apikey). Or upgrade to Plus to get platform keys included!

### 🛠️ Powerful Admin Dashboard
*   **Control Center**: Manage users, subscriptions, and app config in real-time.
*   **Dynamic Logic**: Toggle maintenance mode or adjust pricing without redeploying.
*   **Infrastructure Config**: Configure your self-hosted AI endpoints directly from the UI.

## 🏠 Self-Hosted Infrastructure

TruthLens is designed to run its own AI infrastructure for **zero API costs** and **unlimited usage**.

| Service | Purpose | Model/Engine | Status |
|---------|---------|--------------|--------|
| **Ollama** | LLM Inference | `tinyllama` (1.1B) | ✅ Integrated |
| **SearXNG** | Web Search | Metasearch | ✅ Integrated |

*   🔒 **Privacy First**: Your queries stay on your server when using self-hosted models.
*   💰 **Zero Recurring Costs**: No per-token billing.
*   🚀 **Configurable**: Update URLs in `Admin > Settings`.

## 💻 Developer API Guide

TruthLens exposes a modular service architecture. Here's how to interact with the core systems:

### 1. AI Service (`services/aiService.ts`)
The central hub for all intelligence.
```typescript
import { getSwarmResponse } from '@/services/aiService';

// Races Ollama, Groq, and Gemini to answer
const response = await getSwarmResponse("Is Red Dye 40 bad for kids?");
```

### 2. Product Search (`app/actions.ts`)
Unified interface for OpenFoodFacts + External Search.
```typescript
import { getProductAction } from '@/app/actions';

// Fetches from DB or scrapes web via SearXNG
const product = await getProductAction("barcode_or_name");
```

### 3. System Config (`services/systemService.ts`)
Dynamic configuration engine backed by Firestore.
```typescript
import { getSystemSettings } from '@/services/systemService';

// Get dynamic API keys (including self-hosted URLs)
const settings = await getSystemSettings();
console.log(settings.apiKeys.ollamaUrl);
```

## 🛠️ Getting Started

1.  **Clone the Repo**:
    ```bash
    git clone https://github.com/boubli/TruthLens.git
    cd TruthLens
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Create `.env.local`:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=...
    NEXT_PUBLIC_GEMINI_API_KEY=...
    NEXT_PUBLIC_GROQ_API_KEY=...
    ```

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## 📄 License

Copyright © 2025 Youssef Boubli. Licensed under the [AGPL-3.0](LICENSE).

This project is **open source for collaboration**. You are welcome to:
- ✅ Use, study, and modify the code
- ✅ Contribute via pull requests
- ✅ Fork for personal/educational use

You may **NOT**:
- ❌ Rebrand and redistribute as your own product
- ❌ Use commercially without open-sourcing your modifications

## 🗺️ Roadmap & Future Plans

We're building TruthLens to be the most comprehensive nutrition assistant. Here's what's planned—**contributions welcome!**

### 🔥 High Priority
| Feature | Description | Difficulty |
|---------|-------------|------------|
| 🌍 **Multi-language Support** | i18n for Arabic, French, Spanish, German | Medium |
| 📊 **Nutrition Dashboard** | Weekly/monthly intake charts & insights | Medium |
| 🍽️ **Meal Planning AI** | Generate personalized meal plans based on goals | Hard |
| 🏋️ **Fitness Integration** | Sync with Apple Health / Google Fit | Hard |

### ⭐ Feature Ideas
| Feature | Description | Difficulty |
|---------|-------------|------------|
| 📸 **Visual Food Recognition** | AI to identify food from photos | Hard |
| 🛒 **Shopping List Generator** | Auto-generate lists from meal plans | Medium |
| 👥 **Family Profiles** | Track nutrition for multiple users | Medium |
| 🎮 **Gamification** | Achievements, streaks, health quests | Easy |
| 📱 **Native Mobile Apps** | React Native iOS/Android apps | Hard |
| 🔔 **Smart Reminders** | Hydration, meal timing notifications | Easy |

### 🛠️ Technical Improvements
- [ ] Unit tests & E2E testing (Jest, Playwright)
- [ ] CI/CD pipeline improvements
- [ ] Performance optimization
- [ ] Offline-first PWA enhancements
- [ ] API documentation (OpenAPI/Swagger)

> 💡 **Want to work on something?** Open an issue first to discuss your approach!

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

### How to Contribute

1. **Fork** the repository
2. **Create a branch**: `git checkout -b feature/your-feature-name`
3. **Make changes** and commit: `git commit -m "feat: add your feature"`
4. **Push** to your fork: `git push origin feature/your-feature-name`
5. **Open a Pull Request** to `main`

### Contribution Guidelines

- 📝 **Open an issue first** for major changes
- ✅ **Follow existing code style** (TypeScript, ESLint)
- 🧪 **Test your changes** before submitting
- 📖 **Update docs** if needed
- 🔒 **Never commit secrets** or API keys

### Good First Issues

Look for issues labeled `good first issue` or `help wanted` to get started!

---
<p align="center">
  <em>Empowering healthier choices, one scan at a time.</em>
</p>
