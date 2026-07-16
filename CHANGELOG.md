# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **Vacancy Announcement Tracking**: Added `vacancyAnnouncementNo` to `applicants` and `positions` database tables and integrated it into the application.
- **Vacancy Filter**: Implemented an "All Vacancies" dropdown filter across dashboard steps (Step 1, Step 2, Step 3) to allow filtering applicants by vacancy announcement numbers.
- **Plantilla Updates**: Enhanced Plantilla Location UI to support multiple assignments in `modal_plantilla.hbs`.

### Changed
- **Excel Exports**: Updated CAR, IER, and VER excel export utilities and routes to incorporate vacancy announcement details.
- **Controllers & Views**: Modified controllers and view components to handle and display vacancy announcement data.
- **Seeders**: Updated database seeders to populate mock `vacancyAnnouncementNo` values.

### Fixed
- **Dashboard Prints:** Fixed an issue where `.xlsx` print exports (CAR, IER, VER) would overcrowd on a single page by adjusting `exceljs` page setup properties (`fitToHeight` and `printTitlesRow`).
- **Dashboard UI:** Fixed a bug where the Metrics tab would incorrectly show as active when refreshing while on the Backup tab.
- **Seeding Script:** Fixed a `401 Unauthorized` token expiration bug during massive (100k+) local database seeding processes in `seedApplicants.js` by extending the JWT `expiresIn` from `1h` to `24h`.

### Troubleshooting
- **Service Workers:** Diagnosed and provided a fix for browser-level Service Worker conflicts (`Failed to fetch` on `sw.js` and `osw.js`) caused by zombie service workers from unrelated localhost projects.
