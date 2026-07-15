# Recruitment Selection Process (RSP)

This repository contains the backend and frontend components for the Recruitment Selection Process (RSP) system.

## Project Structure

- `rsp-dashboard/` - Administrative dashboard for managing applicants, tracking metrics, and processing documents.
- `rsp-portal/` - Applicant-facing portal for viewing statuses, applying to positions, and submitting requirements.

## Recent Updates

- Fixed print overcrowding issues in Excel exports (`exceljsCAR.js`, `exceljsIER.js`, `exceljsVER.js`).
- Resolved a UI bug where the metrics tab persisted incorrectly after dashboard refreshes.
- Addressed `401 Unauthorized` token expiration errors during massive local database seeding processes (`seedApplicants.js`).
- Investigated and provided troubleshooting steps for ghost Service Worker conflicts on localhost ports.

## Getting Started

See the respective directories for installation and startup instructions.
