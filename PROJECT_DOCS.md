# TruthLens - Private Project Documentation
> **Repository**: Private (not public, not free)  
> **Owner**: Youssef Boubli  
> **Stack**: Next.js 16, Firebase, TypeScript, Material-UI

---

## 🏗️ Architecture Overview

```
TruthLens/
├── app/                    # Next.js App Router pages
│   ├── (admin)/           # Admin dashboard routes
│   ├── api/               # API routes (serverless)
│   ├── pc-builder/        # PC Geek Builder (NEW)
│   ├── scan/              # Barcode scanner
│   └── ...                # User-facing pages
├── components/            # React components
├── services/              # Business logic services
├── types/                 # TypeScript types
├── lib/                   # Firebase & utilities
├── context/               # React Context (Auth, etc.)
├── hooks/                 # Custom React hooks
└── public/                # Static assets & icons
```

---

## 💎 Subscription Tiers

| Tier | Price | Target Audience |
|------|-------|-----------------|
| **Free** | $0 | Trial users, limited features |
| **Plus** | TBD | Casual users, basic premium |
| **Pro** | TBD | Power users, full features |
| **Ultimate** | TBD | Enterprise, white-label |

### Feature Matrix

| Feature | Free | Plus | Pro | Ultimate |
|---------|:----:|:----:|:---:|:--------:|
| Daily Scans | 5 | 20 | ∞ | ∞ |
| Scan History | 10 | 50 | ∞ | ∞ |
| Multi-Scan | 1 | 3 | 10 | 99 |
| AI Analysis | Basic | Advanced | Premium | Premium |
| Smart Grading | ❌ | ✅ | ✅ | ✅ |
| AI Truth Detector | ❌ | ❌ | ✅ | ✅ |
| Advertisements | ✅ | ❌ | ❌ | ❌ |
| Global Search | ❌ | ✅ | ✅ | ✅ |
| Visual Search (Photo) | ❌ | ❌ | ✅ | ✅ |
| AI Meal Planning | ❌ | ❌ | ✅ | ✅ |
| AI Chat Assistant | ❌ | 10/day | ∞ | ∞ |
| Product Compare | ❌ | 2 | 5 | ∞ |
| Eco Score Analysis | ❌ | ❌ | ✅ | ✅ |
| Gamification (Quests) | ✅ | ✅ | ✅ | ✅ |
| **PC Geek Builder** | ❌ | ❌ | ✅ | ✅ |
| Export (PDF/CSV/Excel) | - | CSV | All | All |
| Priority Support | ❌ | ❌ | ✅ | ✅ |
| White Label Branding | ❌ | ❌ | ❌ | ✅ |
| Beta Access | ❌ | ❌ | ❌ | ✅ |

---

## 📱 All Application Routes

### User-Facing Pages
| Route | Page | Access |
|-------|------|--------|
| `/` | Home Dashboard | All users |
| `/scan` | Barcode Scanner | All users |
| `/product/[id]` | Product Details | All users |
| `/global-search` | Global Product Search | Plus+ |
| `/search/photo` | Visual Search (Photo) | Pro+ |
| `/ai-chat` | AI Assistant | Plus+ |
| `/compare` | Product Compare | Plus+ |
| `/favorites` | Saved Favorites | All users |
| `/history` | Scan History | All users |
| `/recommendations` | Smart Picks | All users |
| `/meal-planner` | AI Meal Planning | Pro+ |
| `/quest` | Gamification | All users |
| `/pc-builder` | **PC Geek Builder** | Pro+ |
| `/upgrade` | Subscription Upgrade | All users |
| `/profile` | User Profile & Settings | Logged in |
| `/support` | Support Chat | All users |
| `/install-guide` | PWA Install Guide | All users |

### Auth Routes
| Route | Purpose |
|-------|---------|
| `/login` | User login |
| `/signup` | New user registration |
| `/reset-password` | Password recovery |
| `/request-access` | Access request form |
| `/set-admin` | Admin account recovery |

### Admin Routes (`/admin/*`)
| Route | Purpose |
|-------|---------|
| `/admin` | Admin Dashboard |
| `/admin/users` | User Management |
| `/admin/settings` | System Configuration |
| `/admin/events` | Seasonal Events Manager |
| `/admin/support` | Support Tickets |
| `/admin/chat` | Chat History |
| `/admin/tiers` | Tier Configuration |
| `/admin/payments` | Payment History |
| `/admin/access-codes` | Access Code Generator |
| `/admin/access-requests` | Access Requests |
| `/admin/cancellations` | Cancellation Requests |
| `/admin/themes` | Theme Customization |
| `/admin/settings/recovery` | Admin Recovery |

---

## 🔌 API Endpoints

### Product APIs
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/product/scan` | POST | Process barcode scan |
| `/api/search-by-image` | POST | Visual search |

### PC Builder APIs
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/pc-builder/generate` | POST | Generate AI PC build |
| `/api/pc-builder/save` | POST | Save build to profile |

### Admin APIs
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/users` | GET/POST | User management |
| `/api/admin/keys` | POST | Secure API key storage |
| `/api/admin/ai-test` | POST | Test AI provider |
| `/api/admin/ollama/models` | GET | Fetch Ollama models |
| `/api/admin/backup` | POST | Database backup |
| `/api/admin/upload` | POST | File upload |
| `/api/admin/delete-file` | POST | File deletion |
| `/api/admin/send-notification` | POST | Push notifications |
| `/api/admin/action` | POST | Admin actions |

### Other APIs
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ollama` | POST | Ollama AI proxy |
| `/api/access/submit` | POST | Submit access request |
| `/api/access/validate` | POST | Validate access code |
| `/api/notifications/subscribe` | POST | Push notification subscribe |
| `/api/notifications/send-chat-push` | POST | Send chat push |
| `/api/v1/event_config` | GET | Event configuration |

---

## 🤖 AI Integrations

### Providers Supported
| Provider | Usage | Config Location |
|----------|-------|-----------------|
| **Groq** | Fast inference (Llama 3.3) | Admin Settings |
| **Gemini** | Google's AI | Admin Settings |
| **OpenAI** | GPT models | Admin Settings |
| **DeepSeek** | Alternative AI | Admin Settings |
| **Ollama** | Self-hosted AI | Azure VM |
| **GitHub Models** | PC Builder AI | Admin Settings |

### AI Features
- **Smart Grading**: AI-powered product health scoring
- **Truth Detector**: Marketing claim verification
- **AI Chat**: Conversational assistant
- **Meal Planning**: Diet-based meal suggestions
- **PC Builder**: Hardware recommendations & bottleneck analysis

---

## 🔧 External Services

| Service | Purpose | Config |
|---------|---------|--------|
| **Firebase** | Auth, Firestore, Storage | `.env.local` |
| **SearXNG** | Real-time price search | Admin Settings |
| **Open Food Facts** | Product database | Auto |
| **Appwrite** | File storage (music) | Admin upload |
| **GitHub Models** | AI inference | Admin Settings |

---

## 🎨 Special Features

### Seasonal Events
- ❄️ Snow Effect
- 🌧️ Rain Effect
- 🍂 Falling Leaves
- 🎊 Confetti
- 🎄 Christmas Theme

### Multi-Language Support
- 🇺🇸 English (en)
- 🇫🇷 French (fr)
- 🇪🇸 Spanish (es)
- 🇵🇹 Portuguese (pt)
- 🇲🇦 Moroccan Darija (ar_MA)

### PWA Features
- Installable as native app
- Offline support (Service Worker)
- Push notifications
- Background sync

---

## 🔐 Security

- **Authentication**: Firebase Auth (Email, Google, etc.)
- **Authorization**: Role-based (user, admin)
- **API Protection**: JWT Bearer tokens
- **Secure Keys**: Server-side vault (`_system_secrets`)
- **Admin Recovery**: TOTP-based 2FA

---

## 📂 Key Configuration Files

| File | Purpose |
|------|---------|
| `types/user.ts` | Tier features & config |
| `types/system.ts` | System settings types |
| `types/pcBuilder.ts` | PC Builder types |
| `lib/firebase.ts` | Firebase client config |
| `lib/firebaseAdmin.ts` | Firebase Admin SDK |
| `context/AuthContext.tsx` | Auth state management |
| `next.config.ts` | Next.js configuration |
| `.env.local` | Environment variables |

---

## 🚀 Deployment

- **Platform**: Vercel
- **Database**: Firebase Firestore
- **AI Server**: Azure VM (Ollama)
- **Search Engine**: Azure VM (SearXNG)
- **Repository**: GitHub (Private)

---

*Last Updated: December 12, 2025*
