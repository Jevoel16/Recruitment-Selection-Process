# Recruitment Selection Process (RSP)

This repository contains the backend and frontend components for the Recruitment Selection Process (RSP) system.

## Project Structure

- `rsp-dashboard/` - Administrative dashboard for managing applicants, tracking metrics, and processing documents.
- `rsp-portal/` - Applicant-facing portal for viewing statuses, applying to positions, and submitting requirements.

## Recent Updates

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
