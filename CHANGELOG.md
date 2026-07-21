# Changelog

## 2026-07-21 10:36 (v1.4.3-Release+202607211036)

### Added
- **Form Validations**: Made the `Email Address` field strictly required in both the New Applicant Wizard and the Quick Add Modal to ensure communication lines are always secured.

### Changed
- **Assignment Orders**: Upgraded the Assignment Order DOCX generator and templates to dynamically extract and assign the correct Series Year from the Application Code instead of using a hardcoded year.
- **UI Adjustments**: Added `fit-dropdown-menu` classes to the `Sex` and `Civil Status` dropdowns in the applicant forms to prevent the dropdown options from clipping.



## 2026-07-20 14:03 (v1.4.2-Release+202607201403)

### Changed
- **Dashboard UI**: Implemented standardized `submitSearch` event handling across all search inputs (Masterlist and Steps 1-5) to cleanly intercept `Enter` key presses and prevent default form submission bugs.



## 2026-07-20 13:47 (v1.4.1-Release+202607201347)

### Changed
- **Dashboard UI**: Enhanced the responsiveness of the filter panels across all workflow steps, resolving layout clipping issues and ensuring download buttons no longer wrap awkwardly on smaller displays.
- **Portal UX**: Refined the network error alert message during applicant submission in the Applicant Portal.



## 2026-07-19 17:22 (v1.4.0-Release+202607191722)

### Added
- **Filters**: Extended the `Vacancy Announcement` dropdown filter to Step 4 and Step 5 workflows.
- **Workflow State**: Introduced an `All Steps & Remarks` status filter to Step 4.

### Changed
- **Assignment Orders (Step 5)**: Fully migrated Assignment Order generation from PDF to dynamic Word Document (`.docx`) format utilizing `docxtemplater`, natively supporting dynamic CC assignments.
- **UI Adjustments**: Removed the redundant `Score` column from Step 4 and Step 5 tables to declutter the UI, and restyled the generation badges.

### Removed
- **Legacy Engine**: Purged obsolete PDF assignment letter generation endpoints and routing logic.



## 2026-07-18 10:33 (v1.3.5-Release+202607181033)

### Added
- **Position Setup**: Added a `Position Code` field to the "Add New Position" modal.

### Changed
- **Dashboard UI**: Improved the aesthetic alignment and borders of the search input bars across all workflow steps (Steps 1-5).
- **User Management UI**: Adjusted "Action" column styling in the users table.



## 2026-07-18 10:33 (v1.3.4-Release+202607181033)

### Changed
- **Dashboard Backup UI**: Redesigned the Backup tab into a modern split layout separating "System Backups" (JSON and CSV) from "Reports & Exports" (Docx and VER), alongside a new Data Security disclaimer.



## 2026-07-18 10:30 (v1.3.3-Release+202607181030)

### Added
- **Dashboard Backup UI**: Restored the `dashboard_backup.hbs` partial, adding a dedicated UI tab for downloading Position Docs, Excel VERs, and JSON backups.
- **Database Schema**: Explicitly added `users` and `logs` tables to `database.sql` to support RBAC and audit logging natively during database initialization.



## 2026-07-18 10:23 (v1.3.2-Release+202607181023)

### Added
- **Database Backup**: Added a new `/export/backup/csv` endpoint to download the entire database as a zipped archive of CSV files.
- **Applicant Schema**: Added `doc_dates` column to the `applicants` table.

### Changed
- **Excel Exports**: Removed hardcoded default location text from VER exports; it now defaults to blank or uses dropdown selections.
- **Export Formats**: Removed manual widow/orphan page break estimations from CAR, IER, and VER generators and optimized VER column widths.



## 2026-07-17 19:55 (v1.3.1-Release+202607171955)

### Changed
- **UI Styling**: Applied `custom-ui-select` class to all select inputs across dashboard modals and steps to standardize form appearances.


All notable changes to this project will be documented in this file.

## 2026-07-16 13:13 (v1.3.0-Release+202607161313)

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
