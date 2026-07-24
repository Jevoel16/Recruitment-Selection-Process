# Changelog

## 2026-07-24 23:30 (v1.5.4-Release+202607242330)

### Added
- **UI Enhancements**: Added an `id` to applicant rows in Step 1 to allow precise targeting and prevent UI jitter during row updates.
- **Excel Exports**: Updated CAR and IER Excel generator utilities to handle Parenthetical Titles explicitly and improve grouping by positions.

### Changed
- **Vacancy Tracking**: Applied vacancy system logic adjustments across applicant and position controllers.
- **Repository Maintenance**: Removed temporary bug-fixing scripts (`fix2.js`, `fix_excel.js`) from the repository.

## 2026-07-24 18:41 (v1.5.3-Release+202607241841)

### Changed
- **Seeders**: Updated the default disqualification reason text in `seedApplicants.js` to match the official DO 7 s. 2023 guidelines.
- **Document Generation**: Fixed a bug where the concluding rejection sentence ("Thus, we regret...") was omitted from the Initial Evaluation PDF if the user left the custom reason text area blank. This has now been addressed in the frontend, the API mass-export, and the background PDF generator.
- **Document Generation**: The background PDF generator now uses the same filename logic as the frontend (`[LastName]_[FirstName]_[PositionCode]_[NoticeType]_[id]`) and correctly provides the `{IEDate}` parameter.
- **Cache Busted**: Bumped the script cache-buster in `index_modals.hbs` to resolve browser caching issues with document generation logic.

## 2026-07-23 01:15 (v1.5.2-Release+202607230115)

### Added
- **PDF Generation**: Implemented server-side PDF generation strategies and added PDF export functionality for applicant lists.
- **Email Filtering**: Added dynamic cascading dropdowns in the email modal to improve document template selection logic based on applicant status.
- **Applicant Status**: Updated database schema and seeders to officially support the `DISQUALIFIED_ARCHIVED` status.

### Changed
- **Dashboard UI**: Fixed browser tab loading issues and corrected UI layout inconsistencies across dashboard views.
- **Project Maintenance**: Cleaned up the repository by removing obsolete root test scripts, one-off debug files, and legacy PDF files.

## 2026-07-22 11:00 (v1.5.1-Release+202607221100)

### Added
- **PDF Pre-generation**: Implemented a cross-platform (PowerShell for Windows, LibreOffice for Linux) background PDF generator to decouple document generation from email dispatch.
- **Email Filtering**: The mass email selection list now automatically filters out applicants who are still `PENDING` in Step 1, ensuring only finalized (Qualified/Disqualified) or advanced applicants are notified.

### Changed
- **Mass Email Dispatch**: Rewrote the document email endpoint to fetch pre-generated PDFs instead of converting them on the fly, reducing server load and making mass email dispatch instant.



## 2026-07-22 10:27 (v1.5.0-Release+202607221027)

### Added
- **Plantilla Setup**: Added a `Parenthetical Title` text field to the Plantilla setup modal.

### Changed
- **Email Dispatching**: Refactored the mass email dispatch system to chunk requests (25 applicants per chunk) and added a UI progress tracker. This prevents timeout errors and server overloads when processing bulk email deliveries.
- **Plantilla Setup**: Replaced the hardcoded drop-down selectors for "Place of Assignment" and "Competency" with open text inputs for greater flexibility.



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
