# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Setsuna（刹那）is a real-time text sharing web application for sharing text between devices. Users create a room with a 6-character code, share the code with their other devices, and exchange text in real-time via Server-Sent Events (SSE). Rooms auto-expire after 24 hours.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Turso (SQLite-compatible edge database)
- **ORM**: Prisma with `@prisma/adapter-libsql`
- **Styling**: Tailwind CSS
- **Testing**: Vitest, Testing Library, Playwright
- **Linter/Formatter**: ESLint 9 (Flat Config), Prettier
- **Git Hooks**: husky, lint-staged
- **Deployment**: Vercel

## Development Methodology: TDD

This project follows **t-wada's TDD** (Test-Driven Development):

```
Red → Green → Refactor
1. Write a failing test
2. Write minimal code to pass the test
3. Refactor the code
```

| Target | Approach |
|--------|----------|
| `src/lib/` | TDD (test-first) |
| `src/app/api/` | TDD (test-first) |
| `src/components/` | Test after implementation |
| E2E | Test after implementation |

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Database operations
npx prisma generate          # Generate Prisma client
npx prisma migrate dev       # Run migrations (local SQLite)
npx prisma db push           # Push schema to Turso (production)
npx prisma studio            # Open database GUI

# Build and production
npm run build
npm run start

# Linting & Formatting
npm run lint              # ESLint check
npm run lint:fix          # ESLint auto-fix
npm run format            # Prettier format
npm run format:check      # Prettier check only

# Testing (TDD workflow)
npm run test              # Run all tests
npm run test:watch        # Watch mode for TDD
npm run test:coverage     # Generate coverage report
npm run test:e2e          # Run E2E tests (Playwright)

# Git Hooks (auto-runs via husky)
# pre-commit: lint-staged (ESLint + Prettier on staged files)
# pre-push: npm run test
```

## Architecture

### Data Flow
1. User creates/joins room → Room code stored in Turso
2. User sends text → POST to `/api/rooms/[code]/messages` → SSE broadcast to all connected clients
3. Clients receive real-time updates via `/api/sse/[code]` endpoint

### Key Directories
- `src/app/` - Next.js App Router pages and API routes
- `src/app/api/` - REST API endpoints (rooms, messages, SSE, cleanup)
- `src/lib/` - Core utilities (db client, room-code generator, sse-manager)
- `src/components/` - React components
- `src/hooks/` - Custom hooks (useSSE for real-time)
- `prisma/` - Database schema

### Critical Files
- `src/lib/db.ts` - Prisma client with Turso adapter
- `src/lib/sse-manager.ts` - Manages SSE connections per room
- `src/lib/room-code.ts` - Generates 6-char codes (excludes confusing chars: 0,O,1,I,L)

## Environment Variables

```bash
# Local development
DATABASE_URL="file:./dev.db"

# Production (Turso)
TURSO_DATABASE_URL="libsql://your-db.turso.io"
TURSO_AUTH_TOKEN="your-token"
CRON_SECRET="your-secret"      # For cleanup API auth
```

## Specifications

Detailed specifications are in `docs/`:
- `docs/SPEC.md` - Overall specification
- `docs/API.md` - API endpoints and TypeScript types
- `docs/DB.md` - Database schema and Prisma queries
- `docs/UI.md` - UI/UX design and components
- `docs/TEST.md` - Test specification and TDD guidelines
