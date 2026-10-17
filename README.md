# Recruitment Selection Process (RSP)

This repository contains the backend and frontend components for the Recruitment Selection Process (RSP) system.

## Project Structure

- `rsp-dashboard/` - Administrative dashboard for managing applicants, tracking metrics, and processing documents.
- `rsp-portal/` - Applicant-facing portal for viewing statuses, applying to positions, and submitting requirements.

## Recent Updates

- **Security hardening (dashboard)**: Passwords are now hashed with salted scrypt; legacy SHA-256 hashes still log in and are upgraded automatically on the next successful login. The JWT secret is centralized in `utils/security.js` and is required in production. Added `helmet` security headers, `sameSite` auth cookies, rate limiting on `/login` and `/step2-login`, path-traversal protection on backup downloads, and blocked public access to `/generated_notices`.
- **Security hardening (portal)**: Added a per-IP rate limit on `/api/apply` and stopped returning raw database errors to applicants.
- **Safer document conversion**: Word/LibreOffice PDF conversion moved into `utils/docConverter.js`, passing file paths as arguments instead of building shell commands. A hung conversion only kills the Word process it started, not the user's own Word windows.
- **Performance**: Removed N+1 queries on the dashboard and step pages (document remarks now come from one grouped query), batched child-record inserts, parallelized count/page queries, cached DOCX templates, switched to async file I/O, and added database indexes that are created automatically on startup.
- **Smaller dashboard page**: The Vacancy Setup tab no longer renders every position inline. `/dashboard` HTML dropped from about 2.6 MB to about 240 KB (with ~1,000 applicants and the full positions list). Position rows are now fetched once from `GET /api/positions/vacancy-setup` the first time the tab opens and built in `public/js/dashboard.js`. Vacancy toggles, plantilla setup, the position info modal, and search/filters work the same.
- **Data integrity**: Creating an applicant now runs in a single transaction, so a failure no longer leaves partial records behind.
- **Server reliability**: Added a final error handler (JSON for `/api`, text for pages), graceful shutdown on SIGINT/SIGTERM, a configurable DB pool size, and a 5 MB request body limit (50 MB only for the DOCX-to-PDF upload).
- **Frontend**: Moved the dashboard's inline scripts from `partials/dashboard_scripts.hbs` into `public/js/dashboard.js`. Script and stylesheet URLs now use an automatic cache-busting version (`?v={{assetVersion}}`) instead of hand-edited numbers.
- **Maintenance**: Removed the unused masterlist controller, moved `nodemon` to devDependencies, restored `chart.js` as a dependency, fixed the portal `dev`/`start` scripts, and replaced the leftover Laravel entries in `.gitignore` with Node-specific ones.

- Expanded the generated notice filenames to include the applicant's name, position code, increment, and vacancy details.
- Cleaned up the repository by removing obsolete scripts (`convert.ps1`), unused npm packages, and dead routing code.
- Added an empty state visual prompt in the applicant category selection when no vacancies are available.
- Simplified generated notice filenames and dynamically formatted email attachment names.
- Implemented native Word XML insertion to display disqualified fields in red font inside docxtemplater evaluation notices.
- Cleaned up the repository by removing auto-generated PDF notices, temporary Word lock files, and unused variables.
- Optimized Excel export column layouts.
- Cleaned up one-off debugging scripts and improved text label clarity for assessment dropdowns across dashboard views.
- Fixed performance evaluation bypass and QS fields data-loss bug in the database seeding scripts.
- Resolved docxtemplater "Multi error" exceptions by correcting malformed XML tags inside Assignment Order templates.
- Removed redundant formatting labels (e.g., "Education: Education: ...") from Initial Evaluation Notice documents.
- Fixed duplicate positions from being created during seeding routines.
- Implemented robust PDF generation fallback and an automated background document deletion queue.
- Resolved 504 Gateway Time-outs during bulk email dispatch and stabilized SSE connection polling.
- Improved database seeder headers to scale background processes for over 1000+ applicants.
- Restructured generated PDF filenames to include increments and vacancy numbers.
- Implemented Mobile UI optimizations using responsive table layouts and data-labels.
- Corrected School Staff Categories and customized Position Title Formatting.
- Fixed Applicant UI jitter by targeting specific row IDs during updates in Step 1.
- Adjusted the Vacancy System logic and Excel export tools to explicitly account for Parenthetical Titles.
- Updated the default disqualification reason in the seeders and fixed a document generation bug regarding the rejection sentence fallback.
- Implemented server-side PDF generation strategies and added PDF exports for applicant lists.
- Enhanced email modal filtering with dynamic cascading dropdowns for document template selection.
- Updated database schema and seeders to officially support `DISQUALIFIED_ARCHIVED` status.
- Cleaned up the project repository by removing obsolete root test scripts and legacy debug files.
- Fixed browser tab loading issues and corrected UI layout inconsistencies across dashboard views.
- Decoupled PDF document generation from email dispatch with cross-platform pre-generation support (PowerShell/LibreOffice).
- The mass email dispatch list now automatically hides "PENDING" applicants to prevent accidental early notifications.
- Overhauled the mass email dispatch engine to chunk bulk requests and prevent server timeouts.
- Made applicant email fields strictly required and upgraded Assignment Orders to dynamically extract the series year.
- Optimized the responsive layout for filter panels and download buttons across all dashboard workflow steps.
- Migrated Step 5 Assignment Orders from legacy PDF generation to a dynamic Word Document (.docx) template system.
- Expanded Vacancy Announcement filtering to all workflow steps and removed redundant score columns.
- Redesigned the Backup Tab UI into a split layout separating Database Backups and Document Exports.
- Restored the Backup Tab UI on the dashboard for easier access to exports.
- Added `users` and `logs` schema to the primary database seeder for proper RBAC initialization.

- Added a CSV database backup feature that exports tables as a zipped archive.
- Removed hardcoded defaults and improved page break formatting across Excel exports.

- Implemented vacancy announcement tracking and a new vacancy filter across dashboard views.
- Enhanced Plantilla Location UI to support multiple assignments.
- Updated Excel exports (CAR, IER, VER) to incorporate vacancy announcement details.
- Fixed print overcrowding issues in Excel exports (`exceljsCAR.js`, `exceljsIER.js`, `exceljsVER.js`).
- Resolved a UI bug where the metrics tab persisted incorrectly after dashboard refreshes.
- Addressed `401 Unauthorized` token expiration errors during massive local database seeding processes (`seedApplicants.js`).
- Investigated and provided troubleshooting steps for ghost Service Worker conflicts on localhost ports.

## Getting Started

See the respective directories for installation and startup instructions.

### Dashboard environment variables

Copy `rsp-dashboard/.env.example` to `.env` and fill it in. Settings related to security:

| Variable | Purpose |
| --- | --- |
| `JWT_SECRET` | Secret used to sign login tokens. **Required** when `NODE_ENV=production`. |
| `SUPERADMIN_PASSWORD` | Superadmin password. **Required** when `NODE_ENV=production`. |
| `ADMIN_PASSWORD` | Password for the `admin` user when it is first created (default: `admin123`; change it after first login). |
| `TRUST_PROXY` | Express `trust proxy` setting (default: `loopback`). Set it to match your reverse proxy. |
| `DB_CONNECTION_LIMIT` | Maximum MySQL pool connections (default: `20`). |
