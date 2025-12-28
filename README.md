# Setsuna

> English | **[日本語](./README.ja.md)**

**Setsuna** (刹那, meaning "moment" in Japanese) is a web application for real-time text sharing across devices.

Easily transfer text copied on your smartphone to your PC, or vice versa.

## Features

- **Simple**: Connect devices with a 6-character room code
- **Real-time**: Instant sync via Server-Sent Events (SSE)
- **Secure**: Room codes generated with cryptographically secure random numbers
- **Ephemeral**: Rooms auto-delete after 24 hours (privacy protection)
- **Responsive**: Works seamlessly on both mobile and desktop
- **Dark Brutalist Design**: Monospace fonts, thick borders, neon accents
- **Internationalization**: English and Japanese language support
- **Admin Dashboard**: Password-protected management interface for monitoring and cleanup

## Demo

🌐 **Live Demo**: [https://setsuna-text.vercel.app](https://setsuna-text.vercel.app)

```
┌──────────────────────────────────────────┐
│                                 [EN][JA] │  ← Language Switcher
│          Background: #0a0a0a             │
│                                          │
│           SETSUNA_                       │  ← White + green cursor
│     [REAL-TIME TEXT SHARING]             │  ← Gray, uppercase
│                                          │
│     Share a 6-character room code to     │  ← Description text
│     sync text across multiple devices    │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ Create New Room                    │  │  ← White border 2px
│  │ ──────────────────────────         │  │
│  │ Create a room and share the code   │  │  ← Description
│  │ to access from another device      │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │     Create Room              │  │  │  ← Green bg, black text
│  │  └──────────────────────────────┘  │  │
│  └────────────────────────────────────┘  │
│                                          │
│               ────── or ──────           │  ← Separator
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ Join Existing Room                 │  │
│  │ ──────────────────────────         │  │
│  │  Room Code                         │  │  ← Label
│  │  ┌──────────────────────────────┐  │  │
│  │  │  A B C D 2 3                  │  │  │  ← Black bg, white border
│  │  └──────────────────────────────┘  │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │     Join                      │  │  │  ← White bg, black text
│  │  └──────────────────────────────┘  │  │
│  └────────────────────────────────────┘  │
│                                          │
└──────────────────────────────────────────┘
```

## Tech Stack

| Category      | Technology                          |
| ------------- | ----------------------------------- |
| Framework     | Next.js 15 (App Router), React 19   |
| Language      | TypeScript                          |
| Styling       | Tailwind CSS                        |
| Database      | Turso (SQLite compatible)           |
| ORM           | Prisma                              |
| Real-time     | Server-Sent Events (SSE)            |
| Testing       | Vitest, Testing Library, Playwright |
| Linter/Format | ESLint 9, Prettier                  |
| Git Hooks     | husky, lint-staged                  |
| Deployment    | Vercel                              |
| i18n          | next-intl                           |

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

```bash
# Clone the repository
git clone https://github.com/beagleworks/Setsuna.git
cd Setsuna

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Set up database (local SQLite)
npx prisma migrate dev
```

### Environment Variables

Copy `.env.example` to create `.env`:

```bash
cp .env.example .env
```

Development configuration:

```env
# Local development
DATABASE_URL="file:./dev.db"
```

Production configuration (Turso):

```env
TURSO_DATABASE_URL="libsql://your-db.turso.io"
TURSO_AUTH_TOKEN="your-token"
CRON_SECRET="your-secret"
ADMIN_PASSWORD="your-secure-password"
```

### Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Development Commands

```bash
# Development server
npm run dev

# Build
npm run build

# Production server
npm run start

# Lint
npm run lint
npm run lint:fix

# Format
npm run format
npm run format:check

# Test
npm run test              # Run all tests
npm run test:watch        # Watch mode (for TDD)
npm run test:coverage     # Coverage report
npm run test:e2e          # E2E tests

# Database
npx prisma generate       # Generate Prisma client
npx prisma migrate dev    # Run migrations
npx prisma studio         # Database GUI
```

## Project Structure

```
Setsuna/
├── docs/                      # Documentation
│   ├── SPEC.md               # Full specification
│   ├── API.md                # API specification
│   ├── DB.md                 # Database specification
│   ├── UI.md                 # UI/UX specification
│   └── TEST.md               # Test specification
├── messages/                  # i18n translation files
│   ├── en.json               # English
│   └── ja.json               # Japanese
├── prisma/
│   └── schema.prisma         # DB schema
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── [locale]/         # Locale-aware routes
│   │   │   ├── page.tsx      # Home page
│   │   │   └── room/[code]/  # Room page
│   │   ├── admin/            # Admin dashboard
│   │   │   ├── page.tsx      # Dashboard
│   │   │   ├── login/        # Login page
│   │   │   └── rooms/        # Room management
│   │   └── api/              # API routes
│   ├── components/           # React components
│   ├── i18n/                 # i18n configuration
│   ├── lib/                  # Utilities
│   ├── hooks/                # Custom hooks
│   └── types/                # Type definitions
├── e2e/                      # E2E tests
├── middleware.ts             # next-intl middleware
└── ...config files
```

## Usage

### Create a Room

1. Click "Create Room" on the home page
2. A 6-character room code (e.g., `ABCD23`) will be generated
3. Enter this code on another device or share the URL

### Join a Room

1. Enter the room code on the home page
2. Click "Join"
3. Or navigate directly to `/room/ABCD23`

### Share Text

1. Enter text on the room page
2. Click "Send" or press Ctrl+Enter
3. Text is delivered to all participants in real-time
4. Use the copy button to copy to clipboard

## API

| Endpoint                     | Method | Description          |
| ---------------------------- | ------ | -------------------- |
| `/api/rooms`                 | POST   | Create room          |
| `/api/rooms/[code]`          | GET    | Get room info        |
| `/api/rooms/[code]/messages` | GET    | Get messages         |
| `/api/rooms/[code]/messages` | POST   | Send message         |
| `/api/sse/[code]`            | GET    | SSE connection       |
| `/api/cleanup`               | POST   | Delete expired rooms |
| `/api/admin/auth/login`      | POST   | Admin login          |
| `/api/admin/stats`           | GET    | Get statistics       |
| `/api/admin/rooms`           | GET    | List rooms (admin)   |
| `/api/admin/rooms/[code]`    | DELETE | Delete room          |

See the [API Documentation](./docs/API.md) for details.

## Development Philosophy

This project follows **TDD (Test-Driven Development)**.

```
Red → Green → Refactor
1. Write a failing test
2. Write minimal code to pass the test
3. Refactor the code
```

| Target            | Approach         |
| ----------------- | ---------------- |
| `src/lib/`        | TDD (test-first) |
| `src/app/api/`    | TDD (test-first) |
| `src/components/` | Post-hoc testing |
| E2E               | Post-hoc testing |

## Testing

```bash
# Unit/Integration tests (35 tests)
npm run test

# E2E tests (14 tests)
npm run test:e2e

# Coverage report
npm run test:coverage
```

## Internationalization (i18n)

Setsuna supports English and Japanese. Language switching is available via the UI.

### URL Structure

| Language | URL Pattern              |
| -------- | ------------------------ |
| English  | `/en`, `/en/room/ABCD23` |
| Japanese | `/ja`, `/ja/room/ABCD23` |

### Adding Translations

Translation files are located in the `messages/` directory:

```
messages/
├── en.json    # English
└── ja.json    # Japanese
```

## Documentation

- [Full Specification](./docs/SPEC.md)
- [API Documentation](./docs/API.md)
- [Database Documentation](./docs/DB.md)
- [UI/UX Documentation](./docs/UI.md)
- [Test Documentation](./docs/TEST.md)
- [Changelog](./CHANGELOG.md)

## License

MIT License
