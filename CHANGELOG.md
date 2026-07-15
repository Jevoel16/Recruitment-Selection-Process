# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Fixed
- **Dashboard Prints:** Fixed an issue where `.xlsx` print exports (CAR, IER, VER) would overcrowd on a single page by adjusting `exceljs` page setup properties (`fitToHeight` and `printTitlesRow`).
- **Dashboard UI:** Fixed a bug where the Metrics tab would incorrectly show as active when refreshing while on the Backup tab.
- **Seeding Script:** Fixed a `401 Unauthorized` token expiration bug during massive (100k+) local database seeding processes in `seedApplicants.js` by extending the JWT `expiresIn` from `1h` to `24h`.

### Troubleshooting
- **Service Workers:** Diagnosed and provided a fix for browser-level Service Worker conflicts (`Failed to fetch` on `sw.js` and `osw.js`) caused by zombie service workers from unrelated localhost projects.
