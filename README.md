# TruthLens 🔍🥗

**TruthLens** is a modern, AI-powered Progressive Web App (PWA) designed to demystify the food you eat. By combining advanced computer vision with powerful Large Language Models (LLMs), TruthLens helps users scan products, analyze ingredients, and make healthier dietary choices instantly.

## 🌟 Key Features

*   **🥗 Smart Ingredient Analysis**: Scan product barcodes or labels to instantly get a breakdown of ingredients, revealing hidden additives, allergens, and nutritional value.
*   **🤖 Empowered by AI**:
    *   **AI Chat Assistant**: Have a natural conversation with our AI about food, nutrition, and health goals (`/ai-chat`).
    *   **Multi-Provider Support**: Powered by **Groq** (Llama 3) and **Google Gemini** for fast, accurate insights.
    *   **Personalized Advice**: Recommendations tailored to your specific dietary needs (Vegan, Gluten-Free, Keto, etc.).
*   **📊 Comprehensive Scoring**: Get an instant "Health Score" for every product, backed by scientific data.
*   **💎 Tiered Membership System**:
    *   **Free/Plus**: Bring Your Own Key (BYOK) for AI features.
    *   **Pro/Ultimate**: Unlimited, hassle-free access with platform-managed API keys.
*   **🎨 Beautiful, Adaptive UI**:
    *   Fully customizable themes with Dark/Light mode support.
    *   Smooth animations powered by Framer Motion.
    *   Responsive design that works perfectly on Mobile, Tablet, and Desktop.
*   **💬 Dual Support Channels**:
    *   **AI Assistant**: For instant nutrition answers.
    *   **Support Chat**: Direct chat line to customer service for app help (`/support`).

## 🚀 Tech Stack

*   **Frontend**: Next.js 16 (React 19), TypeScript, Tailwind CSS, Material UI v7.
*   **Backend**: Firebase (Firestore, Auth, Storage).
*   **AI Integration**: Groq SDK, Google Generative AI SDK, Framer Motion.
*   **Platform**: PWA (Progressive Web App) with experimental HTTPS support.

## 🛠️ Getting Started

### Prerequisites

*   Node.js 18+ installed on your machine.
*   Firebase project configured (with `.env` or `firebaseConfig` setup).

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/truth-lens.git
    cd truth-lens
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Run the development server**:
    ```bash
    npm run dev
    ```

4.  **Open the app**:
    Visit `https://localhost:3000` (Note: Uses HTTPS).

## 📂 Project Structure

*   `/app`: Next.js App Router pages and layouts.
    *   `/ai-chat`: AI Assistant interface.
    *   `/support`: Human support chat interface.
    *   `/scan`: Barcode/Product scanning feature.
*   `/components`: Reusable UI components.
*   `/services`: Business logic and API integrations (Firebase, AI).
*   `/lib`: Core configuration (Firebase, Theme).

---
*Powered by TruthLens Team*
