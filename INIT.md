# 🏆 Santander Fiesta Awards — Project Manifesto

> **Personal expense tracker for the Santander Fiesta Awards credit card.**
> White & Gold — just like the card.

---

## 📋 Overview

This is a **React Native (Expo)** Android app that helps you track, categorize, and analyze all expenses made with your Santander Fiesta Awards credit card. Every transaction is stored locally on-device — no accounts, no cloud sync, just your data, your control.

### Core Purpose
- Log every purchase made with the card
- See where your money goes (categorization)
- Understand your spending patterns (analytics)
- Stay within your personal budget goals

---

## 🧱 Tech Stack

| Layer          | Choice                          | Why |
|:---------------|:--------------------------------|:----|
| **Framework**  | Expo SDK 57 (React Native 0.86) | Best DX, OTA updates, prebuilt native modules |
| **Language**   | TypeScript 6.0                  | Type safety across the entire app |
| **Navigation** | expo-router                     | File-based routing (like Next.js), deep linking, shared layouts |
| **Database**   | expo-sqlite v57                 | Local on-device relational DB with live queries (WAL mode) |
| **Icons**      | @expo/vector-icons              | Thousands of icons, built-in with Expo |
| **Charts**     | react-native-gifted-charts      | Gorgeous animated charts with Skia/SVG |
| **Dates**      | date-fns                        | Modular, tree-shakeable date utilities |
| **Lists**      | @shopify/flash-list             | Ultra-performant recycler lists (1000+ transactions) |
| **Gestures**   | react-native-gesture-handler    | Native swipe-to-delete, pull-to-refresh |
| **Animations** | react-native-reanimated         | 60fps UI animations |

---

## 🎨 Design System — White & Gold

### Color Palette

| Token         | Hex       | Usage |
|:--------------|:----------|:------|
| `gold`        | `#C8A84E` | Primary accent, headers, highlights |
| `goldLight`   | `#E8D49E` | Subtle highlights, backgrounds |
| `goldDark`    | `#A68A3E` | Pressed states, deeper accents |
| `white`       | `#FFFFFF` | Cards, surfaces, modals |
| `background`  | `#F5F5F0` | Warm off-white page background |
| `textPrimary` | `#1A1A1A` | Main body text |
| `textSecondary` | `#6B6B6B` | Subtle/helper text |

### Visual Principles
- **Clean & premium** — generous whitespace, thin gold accents
- **Card-like surfaces** — subtle shadows, rounded corners (12px default)
- **Gold as a signal** — used sparingly for emphasis, never overwhelming
- **Typography-driven** — clear hierarchy with system fonts

---

## 📁 Project Structure

```
SantanderFiestaAwards/
├── app/                      # expo-router file-based routing
│   ├── _layout.tsx           # Root layout (GestureHandler, SafeArea)
│   ├── index.tsx             # Home / Dashboard
│   ├── (tabs)/               # Tab navigator group
│   │   ├── _layout.tsx       # Bottom tab bar (white & gold)
│   │   ├── transactions.tsx  # Transaction history list
│   │   ├── analytics.tsx     # Spending charts & insights
│   │   └── settings.tsx      # App settings / export data
│   └── transaction/
│       └── [id].tsx          # Transaction detail screen
│
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── TransactionItem.tsx
│   │   ├── CategoryIcon.tsx
│   │   ├── AmountDisplay.tsx
│   │   ├── GoldButton.tsx
│   │   ├── EmptyState.tsx
│   │   └── Charts/
│   │       ├── SpendingPieChart.tsx
│   │       └── MonthlyBarChart.tsx
│   ├── database/             # expo-sqlite layer
│   │   ├── schema.ts         # Table definitions
│   │   ├── migrations.ts     # Schema versioning
│   │   └── repository.ts     # CRUD operations
│   ├── theme/
│   │   └── index.ts          # Colors, spacing, typography, shadows
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces
│   └── utils/
│       ├── format.ts         # Currency & date formatters
│       └── categories.ts     # Category definitions & icons
│
├── assets/                   # App icons, splash screen
├── app.json                  # Expo configuration
├── package.json              # Dependencies & scripts
├── tsconfig.json             # TypeScript configuration
└── INIT.md                   # This file — project manifesto
```

---

## 🗄️ Database Schema (expo-sqlite)

```sql
-- Core table: every transaction on the card
CREATE TABLE transactions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  date        TEXT    NOT NULL,       -- ISO 8601: YYYY-MM-DD
  description TEXT    NOT NULL,
  amount      REAL    NOT NULL,       -- Positive = expense, Negative = refund
  category    TEXT    NOT NULL,       -- e.g. 'food', 'transport', 'shopping'
  notes       TEXT,
  created_at  TEXT    DEFAULT (datetime('now'))
);

-- Optional: monthly budget targets per category
CREATE TABLE budgets (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  category   TEXT    NOT NULL UNIQUE,
  limit      REAL    NOT NULL,
  month      TEXT    NOT NULL         -- YYYY-MM
);
```

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
pnpm install

# 2. Start Expo dev server
pnpm start

# 3. Run on Android
pnpm android

# 4. Or scan QR with Expo Go app
```

### Prerequisites
- Node.js ≥ 20
- pnpm ≥ 9
- Android Studio (for emulator) or Expo Go on device
- Java 17+ (for Android builds)

---

## 🧪 Development Workflow

```bash
# Type-check the project
npx tsc --noEmit

# Lint
npx expo lint

# Create a production Android build
npx eas build --platform android
```

### Git Conventions
- `main` — production-ready
- `feature/*` — new functionality
- `fix/*` — bug fixes
- Commits: [Conventional Commits](https://www.conventionalcommits.org/)

---

## 📐 Architecture Decisions

### Why expo-router over @react-navigation?
Expo Router is the standard for Expo SDK 52+. It provides file-based routing that maps directly to the `app/` directory — no manual navigation configuration needed. It also handles deep linking and shared layouts natively.

### Why expo-sqlite over WatermelonDB?
For a personal expense tracker (typically < 5,000 transactions), expo-sqlite v14+ with WAL mode and live queries is more than capable. WatermelonDB's lazy-loading architecture is overkill for this dataset size.

### Why date-fns over dayjs or luxon?
date-fns is the most modular option — you only import what you use, keeping bundle size minimal. It has the most comprehensive date utility set for this use case (formatting, grouping by month, comparing dates).

---

## 🔮 Future Enhancements

- [ ] CSV export of transaction data
- [ ] Monthly spending reports as PDF
- [ ] Recurring transaction detection
- [ ] Push notifications for budget alerts
- [ ] Dark mode (inverted white & gold)
- [ ] Biometric lock for app access

---

*Built with ❤️ using Expo, TypeScript, and a whole lot of café con leche.*
