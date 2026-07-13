# Changelog

## 2026-07-13 15:40 (v1.1.9-Release+202607131540)
### ADDED
- Populated all seeded positions with accurate monthly salaries dynamically mapped from their corresponding Salary Grades based on standard Step 1 conversion rates.

## 2026-07-13 14:26 (v1.1.8-Release+202607131426)
### ADDED
- Implemented a robust three-tier Role-Based Access Control (RBAC) system supporting `superadmin`, `admin`, and `evaluator` roles.
- Introduced a dynamic `can_access_step2` permission framework preventing unauthorized accounts from interacting with Step 2 (Deliberation).
- Built a comprehensive user audit logging mechanism that silently records `save`, `update`, `delete`, `proceed`, and `download` actions for standard users and admins.

### CHANGED
- Overhauled the dashboard architecture to conditionally hide/reveal administrative tabs ("Manage Users" and "Logs") entirely based on strictly defined RBAC permissions.
- Upgraded the "Manage Users" Create/Edit/Delete modals to universally match the system's "glass-modal" design aesthetics and native Bootstrap ESC-to-close features via `getOrCreateInstance()`.
- Fortified backend routes for the user management API to strictly prevent standard admins from managing other admins or the superadmin.
- Refactored frontend package routing (`choices.js`, `html-docx-js`) to securely load from internal Node modules (`express.static`) rather than relying on unmanaged manually dropped local scripts.
- Overhauled database seeder and unseeder scripts (`unseed.js`, `seedApplicants.js`) to gracefully navigate the RBAC walls via auto-generated backend JWTs and properly truncate audit logs.

## 2026-07-13 03:26 (v1.1.7-Release+202607130326)
### ADDED
- Implemented outer perimeter border functionality inside the Comparative Assessment Result (CAR) Excel generation to maintain sleek official layout designs without applying heavy inner grids.
- Set a global configuration for default row height logic ensuring untargeted structural rows maintain a strict standard of 22 pixels mathematically.

### CHANGED
- Completely overhauled the Request for Publication of Vacant Positions (VER) template to mathematically match official raw files 1:1, strictly aligning all exact column widths and font layouts.
- Split the monolithic instructional notes footer block in the VER templates into distinct, dynamically scaled row-by-row elements to eradicate wrapped-cell layout breaking.
- Adjusted CAR explicit signature padding block, dynamically shifting line heights from pixel measurements to explicit layout points (`.points`) to strictly map to raw dimensions.

## 2026-07-12 01:36 (v1.1.6-Release+202607120136)
### ADDED
- Decoupled database initialization into `seedPositions.js` and `seedApplicants.js` for modular data seeding, allowing focused generation of positions and targeted applicant generation.
- Created `seeders/` and `templates_xml/` directories to better organize backend utility scripts and modular XML template fragments.

### CHANGED
- Fixed corrupted Word Document issues (`Vacancy_Endorsement.docx`) by resolving ID conflicts in dynamically generated XML template fragments (`letterhead.xml`, `footer.xml`, `table_header.xml`), ensuring the document remains readable in Microsoft Word.
- Corrected the dashboard UI's "Total Vacant Positions" metric to correctly aggregate the mathematical sum of `vacancyCount` across positions instead of merely counting the total number of unique position rows.
- Cleaned up the Metrics dashboard UI by stripping fractional labels to present straightforward vacancy integer counts.

### REMOVED
- Purged legacy text logs, corrupted prototype `.docx` and `.xml` files, and outdated seeder test scripts from the root directory to maintain a clean production environment.
- Removed deprecated reference document `salary_matrix.md`.

## 2026-07-09 15:52 (v1.1.5-Release+202607091552)
### ADDED
- Integrated "Performance Rating (RPMS 10-point scale)" calculation logic into the Evaluation Method options in Step 2.
- Added explicit minimum and maximum criteria ranges to the Midpoint Helper labels for enhanced clarity during manual data entry.

### CHANGED
- Synchronized the visual design of the standalone "Add Applicant" category grid to perfectly match the "Vacancy Setup" grid (large folder icons, consistent hover states, and unified pagination layout).
- Refactored `applicantWizard.js` and standalone modules to resolve JavaScript global function collisions (`backToCategories`), ensuring flawless backward navigation across both contexts.

### REMOVED
- Purged unused `(CT)` positions (e.g., Accountant II (CT), Clerk III (CT)) from the primary `seed_positions.js` database initializer.
- Removed legacy manual pagination controls from the unified applicant wizard modal, replacing them entirely with the standardized `PaginationHelper` logic.
- Deleted deprecated Excel template files (`ADAS-IER.xlsx`, `Non-Teaching SG 1-9.xlsx`) as the system now dynamically natively generates Excel exports from scratch via `exceljs`.

## 2026-07-09 08:22 (v1.1.4-Release+202607090822)
### ADDED
- Implemented corresponding numerical Level Increment selections for Qualification Standards (Education, Training, Experience) directly within the Position Info Modal.
- Extended the database `positions` schema to support `qsEducationLevel`, `qsTrainingLevel`, and `qsExperienceLevel`.

### CHANGED
- Overhauled `assessment.js` to automatically fetch and apply the configured position's increment level natively within the Step 2 Evaluation Calculators.
- Updated `seed.js` and `seed_positions.js` to map default increment levels intelligently (e.g. assigning Level 6 for "Bachelor's degree" and Level 0 for "None required").

### REMOVED
- Purged temporary scripts and obsolete codes generated during recent updates to maintain repository cleanliness.

## 2026-07-09 06:10 (v1.1.3-Release+202607090610)
### ADDED
- Implemented `titleCase` Handlebars helper to universally format applicant names in Title Case across the Masterlist and all Step 1-5 workflow tables.

### CHANGED
- Overhauled the applicant data payload generation in `seed.js` to populate realistic, randomized datasets including civil status, religion, disability, ethnic group, education, and precisely formatted JSON address structures.
- Updated the applicant name string formatter in the IER Excel generator (`excelGenerator.js`) to strictly adhere to the `Last Name, First Name, M.I.` naming convention.
- Restricted the width of the "Notes and Instructions for the HRMO" block in the IER export to span a maximum of 10 columns (columns A-J) to prevent merged-cell conflicts when concealing data privacy columns.
- Changed browser form validations for numerical assessment fields (Rating, Hours, Years) by swapping `type="number"` with explicitly regex-filtered `type="text"` inputs to safely bypass destructive browser-native decimal handling bugs.

## 2026-07-08 16:30 (v1.1.2-Release+202607081630)
### ADDED
- Added `appointmentEffectivity` date field in the Step 5 assignment modal and database schema.
- Added "Newly Promoted" and "No Appearance" buttons/statuses in the Step 2 evaluative assessment, enforcing a 0-score calculation while maintaining them on the Step 3 leaderboard and CAR exports.

### CHANGED
- Refactored Excel export generation (IER and CAR) out of their respective Express routes into a dedicated utility file `utils/excelGenerator.js` for better modularity.
- Updated IER and CAR exports to support distinct export modes: "With Name", "With Personal Details" (currently disabled), and "Without Name".
- Ensured "Without Name" CAR export strictly maintains anonymity by completely stripping the Applicant Name column for public posting compliance.

### FIXED
- Fixed a workflow disruption where assessed applicants were failing to transition to the Step 3 module by correcting the UI submission endpoint to use `PUT /status` instead of a non-existent `/score` route.
- Corrected the high-concurrency API seeder script (`seed.js`) to properly finalize the `ASSESSED` status of applicants, ensuring accurate Step 3 population.

### REMOVED
- Removed obsolete `alter.js` database migration script and cleaned up lingering unused variable declarations from the export routes.

## 2026-07-08 14:15 (v1.1.1-Release+202607081415)
### ADDED
- Implemented `Choices.js` searchable dropdown integration globally for Assessment calculators to replace basic selects and fix overlapping UI layers.
- Added strict `oninput` keypress restrictions for Criteria H (Potential) and Criteria D (Performance) inputs based on their dynamic maximum allowable scores.

### CHANGED
- Cleaned up modularity: extracted the unified Masterlist modal into a dedicated partial `modal_unified.hbs`.
- Removed massive redundant codebase segments by utilizing a single-source-of-truth `index_modals.hbs` across all views (`index`, `dashboard`, `add-applicant`), eliminating the duplicated `dashboard_modals.hbs` and `modals.hbs`.

### REMOVED
- Deleted obsolete legacy UI components and route handlers for single-score functionality (`scores.js`, `modal_score.hbs`, and the `/api/applicants/:id/score` endpoint) as it was superseded by the detailed Evaluative Assessment system.
- Purged various `.ps1`, `.xml`, and one-off `fix_*.js` patch scripts from the root directory that were used during development but are no longer necessary.
## 2026-07-08 02:34 (v1.1.0-Release+202607080234)
### ADDED
- Implemented robust document generation using Word (`.docx`) templates via `docxtemplater`, `pizzip`, and `html-docx-js`, replacing the previous PDF-based solution.
- Added comprehensive native Excel exports for the Comparative Assessment Result (CAR) and Initial Evaluation Register (IER) using `exceljs`.
- Added new requirement `req_folders` and set default requirement values to TRUE in the database schema.
- Introduced multiple backend helper scripts and docMaker handlers to generate accurate, template-based Word documents across all workflow steps.

### CHANGED
- Transitioned all document generation (Initial Evaluation, Assignment Orders, Requirements) from PDF to Word Documents (`.docx`).
- Refactored `server.js` by extracting document export logic into respective template handler scripts (`docMaker*.js` and `excelExport*.js`) for modularity.
- Updated frontend UI components and javascript files (`applicantDetails.js`, `assignment.js`, `requirements.js`) to support the new Word Document generation.
- Updated the primary logos to general placeholder images (`image1.png`, `image2.png`, `image3.png`).

### REMOVED
- Removed `jspdf` dependency and deprecated `pdfGenerator.js` entirely.

## 2026-07-06 14:02 (v1.0.2-Release+202607061402)
### ADDED
- Integrated a Server-Sent Events (SSE) API lock mechanism combined with JWT-based session tracking to eliminate deadlocks.
- Implemented robust signature alignment spacing inside the CAR XLS export using algorithmic string manipulation padding.

### CHANGED
- Pre-pended standard date-timestamps to export-specific logging channels ensuring uniform consistency with Morgan console audits.
- Refined the table structures within the CAR XLS generator, utilizing a thick outer box border solely for the main matrix and separating the instructional notes into a dedicated borderless section.

### FIXED
- Fixed a major concurrency vulnerability where closed browser tabs held API locks indefinitely by implementing continuous backend stream monitoring and automatic clearance drops.
- Fixed a UI formatting glitch in the Step 1 Initial Evaluation view where double margins were incorrectly stacking headers.
- Fixed inconsistent table row heights in Step 4 requirements checklist caused by unnecessary CSS wrappers.
- Removed unused and deprecated scratch scripts from the root directory to maintain repository cleanliness.

## 2026-07-05 23:35 (v1.0.1-Release+202607052335)
### ADDED
- Implemented stateful tab persistence on the Dashboard using `history.replaceState` and `sessionStorage`, ensuring the UI cleanly stays on the Masterlist or Vacancy Setup tab across page reloads without flickering.
- Added success toast notifications for successful PDF generation across Step 1 and Step 5.
- Added success toast notifications when saving Position Standards in the Vacancy Setup tab and performing CRUD operations in applicant document modals.

### CHANGED
- Replaced the full page-reload behavior when deleting an applicant with instant DOM updates (row removal), significantly improving UI responsiveness.
- Improved the aesthetic of the glass-panel search bars in the Masterlist and other tabs by removing the default form control borders for a seamless pill shape.
- Updated the header text in the Step 1 Initial Evaluation PDF to use the "Canterbury" font, matching the visual style of Step 5.
- Adjusted the address field in the Step 1 PDF to strictly display only the city.
- Changed the "Search by name or tracking number..." placeholder in the dashboard to "Search by name, applicant code, or position...".

### FIXED
- Addressed a database ENUM truncation error (`WARN_DATA_TRUNCATED` errno 1265) that prevented applicant statuses from updating to 'COMPLETED' by altering the `applicants` table `status` ENUM to include 'COMPLETED'.
- Fixed an issue where generating PDFs from the unified Masterlist modal would forcefully kick the user out of the modal; PDF generation now successfully suppresses the page reload.

## 2026-07-05 16:47 (v1.0.0-Release+202607051647)
### ADDED
- Implemented MVC Architecture by separating route logic into `routes/apiRoutes.js` and `routes/viewRoutes.js`.
- Extracted backend controllers (`applicantController.js`, `positionController.js`, `viewController.js`) for modularity.
- Extracted frontend utilities into `public/js/utils.js` and common toast UI into `views/partials/global_toasts.hbs`.
- Added `morgan` middleware configured to log state changes (`POST`, `PUT`, `DELETE`) as a professional audit trail.
- Implemented server-side console logging for tracking IER and CAR export execution times.
- Implemented a dedicated tracking endpoint (`POST /api/logs/pdf-export`) to log client-side PDF rendering times.
- Created `db_reset+seed.js` for explicit database structure initialization and mock applicant generation.

### FIXED
- Removed dangerous auto-recreating `db_setup.js` from `npm run dev` script to prevent accidental data loss.
- Fixed an N+1 query performance bottleneck in `IER` export route that caused the server to hang on large applicant lists.
- Fixed `masterlist` page 500 error by correctly routing `GET /masterlist` to `GET /dashboard?tab=masterlist`.
- Fixed `/api/export/ier` route hanging bug caused by an empty route definition intercepting the request.
- Cleaned up `package.json` scripts to only have necessary distinct commands (`start`, `dev`, `db:reset`, `seed`).
## 2026-07-03 08:20 (v0.8.3-Alpha+202607030820)
### ADDED
- Enhanced "Add Applicant" form validation with active keystroke prevention restricting `Year Graduated`, `Number of Hours`, and `Number of Years` to non-negative numbers, constraining `Rating` to 0-100, and enforcing a strict 11-digit `Contact No.` starting with "09".
- Added a robust form validation system using Bootstrap toast notifications to accurately highlight specific missing or invalid fields across all tabs upon submission.
- Added success and error toast notifications upon saving applicants, replacing standard browser alert popups.

### CHANGED
- Overhauled the Step 1 Initial Evaluation PDF generator to strictly match standard Word Document templates (ANNEX E-3), incorporating dynamic bold placeholders, precise 1.5mm thick header lines, 1-inch (25.4mm) page margins, and a meticulously aligned 3-column Document Control footer table.
- Standardized the visual style of the Step 1 "Generate PDF" buttons (changed to outlined styles) across both the data table and Unified Applicant modal to match Step 5.

### FIXED
- Fixed the "Civil Status" dropdown going blank upon selection by removing conflicting uppercase auto-formatting scripts.
- Fixed an issue where the "Add Applicant" form immediately flagged itself as having unsaved changes upon page load or simple tab navigation, preventing false positive warnings.

## 2026-07-02 13:22 (v0.8.2-Alpha+202607021322)
### ADDED
- Displayed the `Position` column in the Step 4 (Requirements) and Step 5 (Assignment Orders) workflow tables for better visibility.
- Expanded the Assignment Order PDF generator in Step 5 to support `CC` and `CC Designation` parameters.

### CHANGED
- Enhanced the Step 4 and Step 5 search bar to automatically trigger a form submission upon clicking the search icon.
- Re-arranged the Step 4 action buttons, renaming "View Requirements" to "View" and placing it alongside the Score column.
- Simplified the Step 5 PDF generation button label from "Generate PDF" to "PDF".

### FIXED
- Removed unnecessary temporary files, python scratch scripts, and outdated database setup scripts (`alter_db.js`, `migrate.js`) to clean up the repository.


## 2026-07-01 01:59 (v0.8.1-Alpha+202607010159)
### ADDED
- Implemented "Generate PDF (Eval)" capability for applicants in Step 1, producing formatted Initial Evaluation documents based on the official ANNEX E-3 template. The button is correctly locked until an applicant's remarks are updated to 'Assessed'.
- Added fully functional edit (pencil) icons to the Education, Training, Experience, and Eligibility modals, allowing for real-time document updates.
- Added matching `PUT` API endpoints to `server.js` to process document updates seamlessly without page reloads.

### CHANGED
- Redesigned the "View Requirements" modal into a modern 3-column checklist UI and extracted it into a unified partial (`modal_requirements.hbs`) ensuring design consistency across the Masterlist and Step 4 workflows.
- Replaced standalone "View Certificate" links in document modals with compact edit/delete action button groups.
- Restructured `dashboard_modals.hbs` stacking order to ensure all dynamically generated sub-modals render correctly in front of the parent Applicant Details modal.

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

