# TruthLens 🔍🥗

**TruthLens** is an advanced AI-powered nutrition assistant that helps you "see the truth" behind the food you eat. 

Built as a modern Progressive Web App (PWA), it combines the power of **Google Gemini** and **Groq (Llama 3)** to instantly analyze food products, decode complex ingredient lists, and provide personalized health insights based on your specific dietary needs.

## 🌟 Key Features

### 🥗 Smart Food Analysis
*   **Instant Grading**: Our proprietary **Smart Grade** algorithm evaluates products on a scale from **A (Excellent)** to **E (Avoid)** based on ingredients, processing levels, and nutritional value.
*   **Ingredient Decoder**: Instantly identifies harmful additives, allergens, and hidden sugars in any product.
*   **Barcode Scanning**: Quick access to millions of products via camera scan.

### 🤖 Advanced AI Integration
*   **Dual-AI Engine**: Leverages **Groq** for lightning-fast responses and **Gemini 1.5** for deep analytical reasoning.
*   **Context-Aware Chat**: specialized `/ai-chat` for real-time nutrition advice and meal planning.
*   **Dynamic Greetings**: A smart home screen that greets you with context-aware, witty messages depending on the time of day (e.g., "Scanning snacks at 3AM?").

### 💎 Flexible & Lifetime Access
*   **Fair Pricing**: We offer both Monthly subscriptions and a unique **Lifetime Deal** for permanent access.
*   **Tiered Features**:
    *   **Explorer (Free)**: Basic scanning and manual entry.
    *   **Pro**: Unlimited scans, detailed AI analysis, and Priority Support.
    *   **Ultimate**: All Pro features + Exclusive "Global Search" and Beta access.

### 🛠️ Powerful Admin Dashboard
*   **Full Control**: A dedicated Admin Interface to manage Users, Subscription Tiers, and App Configurations in real-time.
*   **Dynamic Logic**: Toggle features, enable maintenance mode, or adjust pricing instantly without redeploying.

## 🚀 Technical Stack

Built with cutting-edge web technologies for performance and scale:

*   **Frontend**: Next.js 14 (App Router), TypeScript, Material UI (MUI).
*   **Backend & Auth**: Firebase (Firestore, Authentication, Security Rules).
*   **AI Services**: Groq SDK, Google Generative AI SDK (Gemini).
*   **State Management**: React Context + Hooks.
*   **Animations**: Framer Motion for buttery smooth UI transitions.
*   **Styling**: Responsive Design supporting dark/light modes and mobile-first layouts.

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
    Create a `.env.local` file with your keys:
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

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Empowering healthier choices, one scan at a time.*
