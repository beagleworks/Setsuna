# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.0] - 2025-12-29

### Changed

- **Framework upgrade** - Upgraded to Next.js 15 and React 19
  - Next.js 14.2.35 → 15.5.9
  - React 18.3.1 → 19.x
  - eslint-config-next 16.1.1 → 16.x (flat config compatible)
- Updated documentation to reflect new tech stack

## [1.2.0] - 2025-12-28

### Added

- **Admin dashboard** - Simple administration panel for managing rooms and viewing statistics
  - Password-based authentication (environment variable `ADMIN_PASSWORD`)
  - JWT session management with HttpOnly cookies (24-hour expiry)
  - Statistics dashboard showing active rooms, total messages, and 7-day activity trends
  - Room management with search, filtering (active/expired), and pagination
  - Message viewer for inspecting room contents
  - Manual cleanup button for expired rooms
- **Admin API endpoints**
  - `POST /api/admin/auth/login` - Password authentication
  - `POST /api/admin/auth/logout` - Session termination
  - `GET /api/admin/stats` - Statistics retrieval
  - `GET /api/admin/rooms` - Room listing with search and filters
  - `GET /api/admin/rooms/[code]` - Room detail with messages
  - `DELETE /api/admin/rooms/[code]` - Force room deletion
  - `POST /api/admin/cleanup` - Manual expired room cleanup
- **Middleware authentication** - Redirect to login for unauthenticated `/admin` access

### Changed

- Updated middleware to handle `/admin` routes separately from i18n

## [1.1.3] - 2025-12-28

### Fixed

- **Footer visibility issue** - Footer was hidden by default and required scrolling to view; fixed by replacing `min-h-screen` with `flex-1` on homepage main element

## [1.1.2] - 2025-12-28

### Added

- **Privacy Policy page** - `/privacy` route with data collection, retention (24h auto-delete), and third-party service disclosure
- **Terms of Service page** - `/terms` route with prohibited use, liability limitations, and data expiration warnings
- **Legal page layout component** - Reusable `LegalPageLayout` for consistent legal page styling
- **Footer legal links** - Added Privacy Policy and Terms of Service links to footer

## [1.1.1] - 2025-12-28

### Fixed

- **XShareButton vertical stretch issue** - Added `inline-flex` to ensure the button fits its content size
- **Room share URL 404 issue** - Fixed share URL to include locale (`/room/CODE` → `/ja/room/CODE`)

## [1.1.0] - 2025-12-28

### Added

- **API rate limiting** - Sliding window algorithm limiting 30 requests/minute
  - IP-based identification
  - X-RateLimit-\* response headers
  - 429 status with Retry-After header
- **Toast notification system** - Brutalist-design notification UI
  - 4 types: success/error/info/warning
  - Notifications for message send success/failure, copy completion, connection state changes
- **X share button** - Share room URL to Twitter/X
- **SSE reconnection exponential backoff** - 1-30 second delay with jitter
  - Maximum 10 retry attempts
  - Progress notification during reconnection
- **Accessibility improvements**
  - aria-live region to announce new messages to screen readers
  - Added role="status" and aria-label to connection indicator
  - Added role="log" to message list
- **Client-side throttling hook** (`useThrottle`)

### Changed

- **useSSE** - Added `onReconnecting` callback and `retryCount`

## [1.0.1] - 2025-12-28

### Added

- **Footer component** - Added copyright display to all pages

## [1.0.0] - 2025-12-28

### Added

- **Internationalization (i18n) support** - English/Japanese via next-intl
  - Translation files (`messages/en.json`, `messages/ja.json`)
  - Language switcher component (LanguageSwitcher)
  - Automatic redirect based on Accept-Language
  - URL structure: `/en`, `/ja`
- **Security enhancements**
  - Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
  - SSE rate limiting (max 100 connections per room, 429 error on exceed)
  - Security review report (`docs/SECURITY.md`)
- **Dark brutalist UI** - Modern and minimal dark theme design
- **Homepage improvements** - Added app feature description text
- **Lucide React icons** - Introduced UI icon library

### Fixed

- **SSE reconnection loop** - Resolved performance issue caused by callback dependencies
- **glob vulnerability (CVE)** - Updated eslint-config-next to 16.1.1
- **Accessibility (a11y)**
  - Added ARIA attributes to Input component (aria-invalid, aria-describedby)
  - Added `role="alert"` to error messages
  - Improved color contrast for WCAG compliance
  - Added reduced-motion support
- **API improvements**
  - Added NaN handling for `limit` parameter
  - Prevented SSE connections with invalid/empty room codes
  - Added UI display for send errors with close button

### Changed

- **ESLint configuration** - Migrated to flat config format (eslint.config.mjs)
- **Vercel deployment settings** - Added prisma generate to build script
- **Cron schedule** - Changed to daily execution for Hobby plan limitations

### Security

- Fixed glob package vulnerability (eslint-config-next update)
- Implemented SSE connection rate limiting
- Added security headers

---

## Version History

| Version | Date       | Description                                           |
| ------- | ---------- | ----------------------------------------------------- |
| 1.3.0   | 2025-12-29 | Next.js 15 & React 19 upgrade                         |
| 1.2.0   | 2025-12-28 | Admin dashboard                                       |
| 1.1.3   | 2025-12-28 | Fix footer visibility issue                           |
| 1.1.2   | 2025-12-28 | Privacy Policy & Terms of Service pages               |
| 1.1.1   | 2025-12-28 | XShareButton & share URL fixes                        |
| 1.1.0   | 2025-12-28 | Rate limiting, toast notifications, a11y improvements |
| 1.0.1   | 2025-12-28 | Footer addition                                       |
| 1.0.0   | 2025-12-28 | Initial official release                              |

[Unreleased]: https://github.com/beagleworks/Setsuna/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/beagleworks/Setsuna/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/beagleworks/Setsuna/compare/v1.1.3...v1.2.0
[1.1.3]: https://github.com/beagleworks/Setsuna/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/beagleworks/Setsuna/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/beagleworks/Setsuna/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/beagleworks/Setsuna/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/beagleworks/Setsuna/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/beagleworks/Setsuna/releases/tag/v1.0.0
