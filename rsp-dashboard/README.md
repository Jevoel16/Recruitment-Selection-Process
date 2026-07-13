# Recruitment Selection Process (RSP) Dashboard

A web-based platform to digitize the recruitment selection process.

## Tech Stack
- **Backend:** Node.js, Express, Morgan (Audit Logging), JSONWebToken, cookie-parser, docxtemplater, exceljs
- **Frontend:** Handlebars (hbs), Vanilla JS, Bootstrap 5, Custom CSS
- **Database:** MySQL

## Features

### Core Architecture & Backend
- **MVC Architecture:** Structured logically with decoupled routes, controllers, and database interfaces for long-term scalability.
- **Role-Based Access Control (RBAC):** Advanced three-tier hierarchical system (Superadmin, Admin, Evaluator) with dynamic dashboard conditionally rendering administrative functions and tightly locking down access to endpoints like Step 2 (Deliberation).
- **Audit Logging:** Implemented professional audit trailing (tracking `save`, `update`, `delete`, `proceed`, and `download` actions) filtered by role, explicitly keeping high-level superadmin traffic out of the audit logs for clean reporting.
- **Concurrency Locks (SSE & JWT):** Robust anti-deadlock mechanisms using JWT tracking cookies alongside continuous Server-Sent Events (SSE) background streams that drop locks instantly upon browser tab closure.
- **Dynamic Seeding & Setup:** Dedicated scripts to safely initialize the database and dynamically map raw text-based qualification standards, including a high-concurrency 1000-applicant seeder with fully randomized, realistic JSON metadata.

### Applicant & Vacancy Management
- **Position Mapping & Qualification Standards:** 72 natively mapped positions complete with their salary grades and fully editable text-based qualification standards.
- **Automated Assessment Scaling:** Fully synchronized Level Increment configurations dynamically bridge the Qualification Standards in Vacancy Setup with the Step 2 Assessment Calculators, automatically allocating predefined levels to accelerate accurate scoring.
- **Dynamic Plantilla Initialization:** Auto-generating Plantilla Item fields synchronized dynamically with Vacancy Count values.
- **Masterlist & Vacancy Dashboard:** Centralized dashboard for managing applicant masterlists alongside dynamic vacancy toggles and slot monitoring.
- **Multi-Step Applicant Wizard:** Seamless data entry flow for applicant information ranging from Personal details to Education, Training, Experience, and Eligibility (now featuring real-time inline editing capabilities and robust active keystroke validation).

### Evaluation & Workflow System (Steps 1-5)
- **Step 1:** Initial Evaluation (Qualify/Disqualify Applicants & Generate Official Word (.docx) Evaluation forms)
- **Step 2:** Deliberation Sheet (Assess & Input Interview Scores; support for "No Appearance", "Newly Promoted" overrides, and robust multi-scale calculators including RPMS 10-point scale)
- **Step 3:** Comparative Assessments (Leaderboard based on Scores with seamless Excel exports handling privacy masking for CAR and comprehensive position formatting for VER)
- **Step 4:** Requirements Collection & Tracking (Monitor missing requirements and qualify for Assignment)
- **Step 5:** Assignment Orders (Generate A4 Word Document (.docx) Assignment Letters with advanced formatting and CC support)

### UI/UX & Modularity
- **Component Modularization:** Sub-divided monolithic frontend templates into clean, feature-specific Handlebars partials, eliminating redundant files in favor of a single-source-of-truth structure, complemented by global formatting helpers (e.g., `titleCase`).
- **Searchable Dropdowns:** Integrated `Choices.js` globally to transform standard form selects into advanced, searchable dropdowns without compromising z-index UI layering in modals.
- **Real-Time Validations:** Form validations using active keystroke prevention restricting incorrect input values (such as dynamically capping assessment inputs) natively on the frontend.
- **Stateful UI & Instant DOM Updates:** Dashboard features persistent state retention across manual page reloads using browser History APIs and session storage, alongside lightning-fast instant DOM updates for CRUD operations to eliminate full page reloads.
- **Modern Aesthetics:** Utilizes responsive glassmorphism UI components (glass panels), custom scrollbars, and seamless borderless inputs for a deeply immersive and premium user experience.

## Installation & Setup
1. Clone or download this directory.
2. Run `npm install` to install dependencies.
3. Create a `.env` file with your MySQL credentials (if not using the default root user without password) or just remove `.example` from the `.env.example` file.
4. Run `npm run seedPositions` to initialize the positions database.
5. *(Optional)* Run `npm run seedApplicants` to open specific vacancies and seed 1,000 mock applicants into the system.
6. To run the local development server (with hot-reloading), run:
   ```bash
   npm run dev
   ```
7. To run the application normally in production, run:
   ```bash
   npm start
   ```
