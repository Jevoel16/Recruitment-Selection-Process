# Recruitment Selection Process (RSP)

This repository contains the backend and frontend components for the Recruitment Selection Process (RSP) system.

## Project Structure

- `rsp-dashboard/` - Administrative dashboard for managing applicants, tracking metrics, and processing documents.
- `rsp-portal/` - Applicant-facing portal for viewing statuses, applying to positions, and submitting requirements.

## Recent Updates

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
