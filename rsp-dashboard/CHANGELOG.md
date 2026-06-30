# Changelog

## 2026-06-30 16:30 (v0.8.0-Alpha+202606301630)
### ADDED
- Implemented an `Assigned Office` filter within the Step 5 (Assignment Orders) module to categorize outputs.
- Restructured `dashboard.hbs` and `index_modals.hbs` into modular component partials for improved maintainability.

### CHANGED
- Modified the Assignment Order PDF generation logic to correctly update applicant status to `COMPLETED` and clear them from the Step 5 UI seamlessly.
- Re-formatted exported Excel and PDF filenames for dynamic consistency (e.g., `{Position}-IER-{MMYYYY}.xlsx`, `AO-{firstname}_{lastname}-{MMYYYY}.pdf`).

### FIXED
- Corrected PDF cache-busting configurations (`pdfGenerator.js?v=1.1`) to prevent stale PDF generation issues.
- Fixed a syntax error involving string interpolation in the `<button>` `onclick` handler in `step5.hbs`.
- Resolved an issue in the Evaluative Assessment Modal where the `Position` label failed to render correctly.

## 2026-06-30 14:07 (v0.7.1-Alpha+202606301407)
### FIXED
- Addressed issue where the Add Applicant Wizard submitted prematurely when the Enter key was pressed in form fields.
- Fixed `training` section bug in the Add Applicant Wizard by using an explicit `prefixMap` instead of unreliable substring logic for dynamic table rendering.
- Resolved an empty UI score column bug in `step5.hbs` by correctly accessing the `scores.total` mapped attribute instead of an undefined variable.

### ADDED
- Implemented an advanced, high-concurrency API-driven seeder (`seed.js`) that automatically simulates 1,000 applicants and dynamically progresses them across workflow stages to stress-test the environment.
- Added nodemon `.hbs` file watch support in `package.json` for both `rsp-dashboard` and `rsp-portal` to prevent caching issues during template development.
- Extracted and modularized position data into `seed_positions.js` to serve as a unified source for the main application and new API seeder.
- Cleaned up the project root by removing outdated Python helper/refactoring scripts.


## 2026-06-30 09:25 (v0.7.0-Alpha+202606300925)
### ADDED
- Masterlist integrated natively into the Dashboard tabs alongside Vacancy Setup.
- Added standard circle/ellipsis pagination to the Masterlist view.
- Extended the "New Applicant Wizard" into a multi-step sequence (Personal Info, Education, Training, Experience, Eligibility).
- Added `Middle Name` field to the applicant submission form.
- Introduced a `Slot` column within the Vacancy Setup, mapped directly from the vacancy counts.
- Implemented a vacancy status filter (Vacant/Non-vacant/All) in the Dashboard.
- Added hard restrictions: Plantilla Items are limited to 100 entries, and saving is blocked if fields are left empty.

### CHANGED
- Unified pagination styling components across Step 2 position selection and Masterlist.
- Removed the standalone "Masterlist" link from the sidebar menu in favor of Dashboard tab integration.
- Consolidated "Add Applicant" modal layout to match the visual width and structure of other side panel UI components.

## 2026-06-29 16:50 (v0.6.0-Alpha+202606291650)
### ADDED
- Dynamic Plantilla setup with auto-generating fields corresponding to Vacancy Counts.
- Implemented elegant two-column layout for Plantilla Item list rendering in the Position Info Modal.
- Added 17 new official positions mapped directly from standard CSC Excel sheets.
- Extracted Plantilla data to its own responsive `col-12` container to prevent modal layout breaking.

### CHANGED
- Transformed Qualification Standards (Education, Training, Experience, Eligibility) from dropdowns into fully editable, multi-line raw text fields in the Position Info Modal.
- Formatted new Position titles to Title Case natively, preserving uppercase for internal parentheticals (e.g., `(CT)`) and Roman Numerals.
- Rewrote the database seeding logic (`seed_positions.js`) to dynamically embed all 72 full position profiles, categories, and raw text-based Qualification Standards directly into the `npm run dev` and `npm run prod` initialization cycle.

### FIXED
- Removed problematic W3C XML Schema linkages (`xmlns="http://www.w3.org/TR/REC-html40"`) from backend `.xls` exporters, permanently eliminating the issue of Microsoft Excel hanging or crashing when intranet devices attempt to open exported documents offline.


## 2026-06-28 20:48 (v0.5.0-Alpha+202606282048)
### ADDED
- Fully implemented point calculators across all criteria (Education, Training, Experience, Performance, Accomplishments, App. of Education, App. of L&D, Potential) following DepEd Order No. 007 s. 2023 / No. 021 s. 2024.
- Added comprehensive position database mapping featuring 241 positions categorized by Teaching, Related Teaching, School Administration, and Non-Teaching.
- Introduced `in_vacancy` tagging to accurately restrict application workflows to active Notice of Vacancy positions.
- Redesigned the top header sidebar UI into a single-row responsive compact header.
- Extracted the "Add Applicant" wizard from a floating modal into a seamless, dedicated `/add-applicant` page routing.
- Established `Dashboard` as the new default root page to organize and filter vacant positions dynamically.
- Developed automated development (`npm run dev`) and production (`npm run prod`) pipeline scripts with native node-based DB initialization and seeding.

### FIXED
- Overhauled database setup sequence to prevent UTF-16 encoding errors in PowerShell.
- Updated nodemon configuration to hot-reload on `.hbs` template modifications.

## 2026-06-23 11:17 (v0.4.0-Alpha+202606231117)
### ADDED
- Replaced top navbar with a dedicated left sidebar layout.
- Migrated all dependencies from CDN to local NPM installations (Bootstrap, Icons).
- Redesigned "Add Applicant" process into a seamless 3-step Wizard.
- Implemented smart Application Code generation (`[District]-[Category]-[Increment]`).
- Split applicant names into `First Name` and `Last Name` fields natively within the database and UI.
- Added global Delete buttons across all tables for permanent record purging.
- Converted modal data submissions to perform in-place dynamic UI updates instead of full page reloads.
- Restructured `applicant_eligibility` database schema to utilize `digitalCopyLink` instead of manual inputs.
- Added a "SYSTEM GENERATED" footer to the assignment PDF letter template.

### FIXED
- Addressed an issue where modifying personal information did not immediately reflect on the dashboard tables.
- Fixed a bug causing delete buttons inside modals to inadvertently trigger page reloads.

---

## 2026-06-22 14:03 (v0.3.0-Alpha+202606221403)
### ADDED
- Added `nodemon` for Hot Module Replacement (HMR) to improve local development workflow.

### FIXED
- Fixed a small visual bug affecting the tab hover interactions.

---

## 2026-06-22 13:15 (v0.2.0-Alpha+202606221315)
### ADDED
- Miscellaneous optimizations to workflow and components (followup commit).

### FIXED
- Resolved minor layout shifting post-implementation.

---

## 2026-06-22 13:14 (v0.1.0-Alpha+202606221314)
### ADDED
- Added `.env.example` file for environment variable standardization.
- Standardized the main body layout styling.
- Added toggleable requirement features for applicant processing.
- Implemented a dynamic search box feature for applicants.

### FIXED
- Fixed PDF formatting issues causing misalignment on generated output.

---

## 2026-06-22 10:41 (v0.0.1-Alpha+202606221041)
### ADDED
- Initial project architecture and structure.
- Basic Express.js server and Handlebars templating initialization.
- Core MySQL database schema for applicant tracking system.

### FIXED
- N/A
