# Recruitment Selection Process (RSP) Dashboard

A web-based platform to digitize the recruitment selection process.

## Tech Stack
- **Backend:** Node.js, Express, Morgan (Audit Logging), JSONWebToken, cookie-parser, docxtemplater, exceljs
- **Frontend:** Handlebars (hbs), Vanilla JS, Bootstrap 5, Custom CSS
- **Database:** MySQL

## Features

### Core Architecture & Backend
- **MVC Architecture:** Structured logically with decoupled routes, controllers, and database interfaces for long-term scalability.
- **Audit Logging:** Implemented `morgan` middleware for filtered professional audit trailing and tracking metrics on document exports.
- **Concurrency Locks (SSE & JWT):** Robust anti-deadlock mechanisms using JWT tracking cookies alongside continuous Server-Sent Events (SSE) background streams that drop locks instantly upon browser tab closure.
- **Dynamic Seeding & Setup:** Dedicated scripts to safely initialize the database and dynamically map raw text-based qualification standards.

### Applicant & Vacancy Management
- **Position Mapping & Qualification Standards:** 72 natively mapped positions complete with their salary grades and fully editable text-based qualification standards.
- **Dynamic Plantilla Initialization:** Auto-generating Plantilla Item fields synchronized dynamically with Vacancy Count values.
- **Masterlist & Vacancy Dashboard:** Centralized dashboard for managing applicant masterlists alongside dynamic vacancy toggles and slot monitoring.
- **Multi-Step Applicant Wizard:** Seamless data entry flow for applicant information ranging from Personal details to Education, Training, Experience, and Eligibility (now featuring real-time inline editing capabilities and robust active keystroke validation).

### Evaluation & Workflow System (Steps 1-5)
- **Step 1:** Initial Evaluation (Qualify/Disqualify Applicants & Generate Official Word (.docx) Evaluation forms)
- **Step 2:** Deliberation Sheet (Assess & Input Interview Scores; support for "No Appearance" and "Newly Promoted" overrides)
- **Step 3:** Comparative Assessments (Leaderboard based on Scores with seamless CAR excel exports handling privacy masking)
- **Step 4:** Requirements Collection & Tracking (Monitor missing requirements and qualify for Assignment)
- **Step 5:** Assignment Orders (Generate A4 Word Document (.docx) Assignment Letters with advanced formatting and CC support)

### UI/UX & Modularity
- **Component Modularization:** Sub-divided monolithic frontend templates into clean, feature-specific Handlebars partials, completely eliminating redundant files like `dashboard_modals.hbs` in favor of a single-source-of-truth structure.
- **Searchable Dropdowns:** Integrated `Choices.js` globally to transform standard form selects into advanced, searchable dropdowns without compromising z-index UI layering in modals.
- **Real-Time Validations:** Form validations using active keystroke prevention restricting incorrect input values (such as dynamically capping assessment inputs) natively on the frontend.
- **Stateful UI & Instant DOM Updates:** Dashboard features persistent state retention across manual page reloads using browser History APIs and session storage, alongside lightning-fast instant DOM updates for CRUD operations to eliminate full page reloads.
- **Modern Aesthetics:** Utilizes responsive glassmorphism UI components (glass panels), custom scrollbars, and seamless borderless inputs for a deeply immersive and premium user experience.

## Installation & Setup
1. Clone or download this directory.
2. Run `npm install` to install dependencies.
3. Create a `.env` file with your MySQL credentials (if not using the default root user without password) or just remove `.example` from the `.env.example` file.
4. Run `npm run db:reset` to initialize a clean database and automatically seed 1,000 mock applicants.
5. *(Optional)* Run `npm run seed` to clear database data and seed new 1,000 mock applicants.
6. To run the local development server (with hot-reloading), run:
   ```bash
   npm run dev
   ```
7. To run the application normally in production, run:
   ```bash
   npm start
   ```
