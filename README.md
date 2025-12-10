
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
  <img src="https://img.shields.io/badge/License-Proprietary-red?style=flat-square" alt="License" />
</p>

---

**TruthLens** isn't just a calorie counter. It's an intelligent nutrition companion that helps you "see the truth" behind the food you eat.

Built as a modern **Progressive Web App (PWA)**, it combines the power of cloud AI (Groq, Gemini) with self-hosted privacy (Ollama, SearXNG) to instantly analyze products, decode ingredients, and generate personalized health quests.

## 🌟 Key Features

### 🥗 Smart Food Analysis
*   **🔎 Instant Grading**: Our proprietary **Smart Grade** algorithm evaluates products from **A (Excellent)** to **E (Avoid)** based on ingredients, processing, and nutrition.
*   **🧪 Ingredient Decoder**: Instantly identifies harmful additives, allergens, and hidden sugars.
*   **📷 Barcode Scanning**: Access millions of products via camera scan.

### 🤖 "AI Swarm" Intelligence
TruthLens uses a unique **AI Swarm** architecture to race multiple AI providers for the fastest, most accurate response:
*   **Self-Hosted First**: Prioritizes your own **Ollama** instance (TinyLlama) for free, private inference.
*   **Cloud Fallback**: Seamlessly switches to **Groq (Llama 3)** or **Gemini 1.5** for complex reasoning.
*   **Context-Aware**: The `/ai-chat` remembers your dietary preferences and health goals.

### 💎 Flexible & Lifetime Access
*   **Fair Pricing**: Monthly subscriptions or a unique **Lifetime Deal**.
*   **Tiered Features**:
    *   **Explorer (Free)**: Basic AI (Azure) + Bring Your Own Key (BYOK) for Premium.
    *   **Pro**: Premium AI Models Included (Groq/Gemini/DeepSeek) + Global Search.
    *   **Ultimate**: All Pro Features + White Label Reports.

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
    git clone https://github.com/yourusername/truthlens.git
    cd truthlens
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

Copyright © 2024 Youssef Boubli via TRADMSS. All Rights Reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, or use of this file, via any medium, is strictly prohibited.

---
<p align="center">
  <em>Empowering healthier choices, one scan at a time.</em>
</p>
