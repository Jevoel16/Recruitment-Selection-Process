# Recruitment Selection Process (RSP) Dashboard

A web-based platform to digitize the recruitment selection process.

## Tech Stack
- **Backend:** Node.js, Express, Morgan (Audit Logging)
- **Frontend:** Handlebars (hbs), Vanilla JS, Bootstrap 5, Custom CSS
- **Database:** MySQL

## Features
- **MVC Architecture:** Structured logically with decoupled routes, controllers, and database interfaces for long-term scalability.
- **Position Mapping & Qualification Standards:** 72 natively mapped positions complete with their salary grades and fully editable text-based qualification standards.
- **Dynamic Plantilla Initialization:** Auto-generating Plantilla Item fields synchronized dynamically with Vacancy Count values.
- **Masterlist & Vacancy Dashboard:** Centralized dashboard for managing applicant masterlists alongside dynamic vacancy toggles and slot monitoring.
- **Multi-Step Applicant Wizard:** Seamless data entry flow for applicant information ranging from Personal details to Education, Training, Experience, and Eligibility (now featuring real-time inline editing capabilities and robust active keystroke validation).
- **Component Modularization:** Sub-divided monolithic frontend templates into clean, feature-specific Handlebars partials, such as unifying the requirements checklist.
- **Step 1:** Initial Evaluation (Qualify/Disqualify Applicants & Generate Official Word-styled PDF Evaluation forms)
- **Step 2:** Deliberation Sheet (Assess & Input Interview Scores)
- **Step 3:** Comparative Assessments (Leaderboard based on Scores)
- **Step 4:** Requirements Collection & Tracking (Monitor missing requirements and qualify for Assignment)
- **Step 5:** Assignment Orders (Generate & Print A4 Assignment Letters with advanced formatting and CC support)
- **Audit Logging:** Implemented `morgan` middleware for filtered professional audit trailing and tracking metrics on document exports.

## Installation & Setup
1. Clone or download this directory.
2. Run `npm install` to install dependencies.
3. Update `.env` file with your MySQL credentials (if not using the default root user without password).
4. Run `npm run db:reset` to initialize a clean database and automatically load the required position data.
5. *(Optional)* Run `npm run seed` to automatically generate and scatter 1,000 mock applicants across the workflow for development testing.
6. To run the local development server (with hot-reloading), run:
   ```bash
   npm run dev
   ```
7. To run the application normally in production, run:
   ```bash
   npm start
   ```
