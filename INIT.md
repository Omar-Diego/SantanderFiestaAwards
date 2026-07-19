# 🏆 Santander Fiesta Awards — Project Manifesto

> *Personal expense tracker for the Santander Fiesta Awards credit card.*
> *Real-time sync between 2 devices · No login · White & Gold*

---

## 📋 Overview

A **React Native (Expo)** Android app for tracking all expenses made with your Santander Fiesta Awards credit card. **Two phones, one shared database** — when one person adds an expense, the other sees it instantly.

### Core Principles
- ⚡ **Real-time sync** via Firebase Firestore
- 🔓 **No accounts or logins** — just a shared group code
- 📱 **Android only** — native APK distribution
- 🎨 **White & Gold** — elegant, card-inspired design
- 📴 **Works offline** — Firestore persistence handles spotty connectivity

---

## 🧱 Tech Stack

| Layer | Choice | Why |
|:------|:-------|:----|
| **Framework** | Expo SDK 57 (React Native 0.86) | Best DX, dev builds, prebuilt native modules |
| **Language** | TypeScript 6.0 | Type safety across the entire app |
| **Navigation** | expo-router | File-based routing, deep linking, shared layouts |
| **Backend** | **Firebase Firestore** | Real-time sync, offline persistence, no server management |
| **Security** | Firebase App Check (Play Integrity) | Blocks unauthorized API access without user login |
| **Icons** | @expo/vector-icons | Thousands of icons, built-in with Expo |
| **Charts** | react-native-gifted-charts | Beautiful animated charts for spending analytics |
| **Dates** | date-fns | Modular, tree-shakeable date utilities |
| **Lists** | @shopify/flash-list | Ultra-performant recycler lists (1000+ transactions) |
| **Gestures** | react-native-gesture-handler | Native swipe-to-delete, pull-to-refresh |
| **Animations** | react-native-reanimated | 60fps UI animations |

---

## 🎨 Design System — White & Gold

### Color Palette
| Token | Hex | Usage |
|:------|:----|:------|
| `gold` | `#C8A84E` | Primary accent, buttons, totals |
| `goldLight` | `#E8D49E` | Subtle highlights, backgrounds |
| `goldDark` | `#A68A3E` | Pressed states, deeper accents |
| `background` | `#F5F5F0` | Warm off-white page background |
| `surface` | `#FFFFFF` | Cards, surfaces, modals |
| `textPrimary` | `#1A1A1A` | Main body text |
| `textSecondary` | `#6B6B6B` | Subtle/helper text |

### Visual Principles
- **Clean & premium** — generous whitespace, thin gold accents
- **Card-like surfaces** — subtle shadows, rounded corners (12px default)
- **Gold as a signal** — used sparingly for emphasis, never overwhelming

---

## 🗄️ Data Model (Firestore)

### Collection Structure
```
/groups/{groupCode}/
  ├── info: {
  │     name: string,        // e.g. "Gastos Casa"
  │     createdAt: Timestamp
  │   }
  └── transactions/
        └── {autoId}: {
              date: Timestamp,
              amount: number,
              description: string,
              category: string,    // "food" | "transport" | ...
              notes?: string,
              createdAt: Timestamp,
              deviceId: string,
              updatedAt?: Timestamp
            }
```

### Categories
| Category | Icon |
|:---------|:-----|
| 🍔 Comida | `silverware-fork-knife` |
| 🚗 Transporte | `car` |
| 🛒 Supermercado | `cart` |
| 🛍️ Shopping | `shopping` |
| 🎬 Entretenimiento | `movie-open` |
| 💊 Salud | `medical-bag` |
| 💡 Servicios | `lightning-bolt` |
| 📚 Educación | `book-open-variant` |
| ✈️ Viajes | `airplane` |
| 📌 Otros | `dots-horizontal` |

---

## 📁 Project Structure

```
SantanderFiestaAwards/
├── app/                          # expo-router file-based routing
│   ├── _layout.tsx               # Root layout (GestureHandler, SafeArea)
│   └── index.tsx                 # Welcome / Group setup screen
│
├── src/
│   ├── components/               # Reusable UI components
│   ├── hooks/
│   │   └── useTransactions.ts    # Real-time Firestore subscription hook
│   ├── services/
│   │   ├── firebase.ts           # Firestore singleton & helpers
│   │   ├── group.ts              # Create/join group management
│   │   └── transactions.ts       # CRUD + real-time subscription
│   ├── theme/
│   │   └── index.ts              # Colors, spacing, typography, shadows
│   ├── types/
│   │   └── index.ts              # Transaction, GroupInfo, Category
│   └── utils/
│       └── categories.ts         # Category definitions & helpers
│
├── assets/                       # App icons, splash screen
├── app.json                      # Expo config (Firebase plugins)
├── babel.config.js               # With react-native-reanimated plugin
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # Strict TypeScript
├── REQUERIMIENTOS.md             # App requirements document
└── INIT.md                       # This file
```

---

## 🔐 Security (No Auth)

Since there's no user login, security relies on two layers:

1. **Firebase App Check (Play Integrity)** — Verifies that API calls come from your genuine Android app, blocking unauthorized scripts or apps
2. **Shared Group Code** — A 4-letter + 4-digit code that both phones enter to access the same data

### Firestore Rules
```javascript
// Only allow access with valid App Check token
allow read, write: if request.app.token != null;
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 20
- pnpm ≥ 9
- Android Studio (for emulator) or physical device
- Firebase account (free tier)

### Setup
```bash
# 1. Install dependencies
pnpm install

# 2. Create a Firebase project and download google-services.json
#    Place it in the project root

# 3. Create development build
npx expo run:android

# 4. For production APK
npx eas build --platform android --profile production
```

### Two-Phone Setup
1. Install the APK on both phones
2. Phone 1: Create a new group → share the code
3. Phone 2: Enter the code to join
4. ✅ Done — both phones see the same expenses in real time

---

## 📐 Architecture Decisions

| Decision | Choice | Why |
|:---------|:-------|:----|
| **Backend** | Firebase Firestore | Real-time sync + offline persistence + no server management |
| **Auth** | None (group code) | Simple for 2 people, no account creation friction |
| **Security** | App Check (Play Integrity) | Blocks unauthorized API access without login complexity |
| **Offline** | Firestore persistence | Automatic sync when connection is restored |
| **Build** | EAS Build | APK distribution without Play Store (if desired) |
| **Routing** | expo-router | File-based routing, clean project structure |

---

## 🔮 Future Enhancements

- [ ] Edit & delete transactions
- [ ] Monthly spending charts (react-native-gifted-charts)
- [ ] Budget goals per category
- [ ] CSV export
- [ ] Dark mode (inverted white & gold)

---

*Built with ❤️ using Expo, Firebase, and TypeScript*
