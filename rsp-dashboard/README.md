# Recruitment Selection Process (RSP) Dashboard

A web-based platform to digitize the recruitment selection process.

## Tech Stack
- **Backend:** Node.js, Express, Morgan (Audit Logging)
- **Frontend:** Handlebars (hbs), Vanilla JS, Bootstrap 5, Custom CSS
- **Database:** MySQL

## Features

### Core Architecture & Backend
- **MVC Architecture:** Structured logically with decoupled routes, controllers, and database interfaces for long-term scalability.
- **Audit Logging:** Implemented `morgan` middleware for filtered professional audit trailing and tracking metrics on document exports.
- **Dynamic Seeding & Setup:** Dedicated scripts to safely initialize the database and dynamically map raw text-based qualification standards.

### Applicant & Vacancy Management
- **Position Mapping & Qualification Standards:** 72 natively mapped positions complete with their salary grades and fully editable text-based qualification standards.
- **Dynamic Plantilla Initialization:** Auto-generating Plantilla Item fields synchronized dynamically with Vacancy Count values.
- **Masterlist & Vacancy Dashboard:** Centralized dashboard for managing applicant masterlists alongside dynamic vacancy toggles and slot monitoring.
- **Multi-Step Applicant Wizard:** Seamless data entry flow for applicant information ranging from Personal details to Education, Training, Experience, and Eligibility (now featuring real-time inline editing capabilities and robust active keystroke validation).

### Evaluation & Workflow System (Steps 1-5)
- **Step 1:** Initial Evaluation (Qualify/Disqualify Applicants & Generate Official Word-styled PDF Evaluation forms)
- **Step 2:** Deliberation Sheet (Assess & Input Interview Scores)
- **Step 3:** Comparative Assessments (Leaderboard based on Scores)
- **Step 4:** Requirements Collection & Tracking (Monitor missing requirements and qualify for Assignment)
- **Step 5:** Assignment Orders (Generate & Print A4 Assignment Letters with advanced formatting and CC support)

### UI/UX & Modularity
- **Component Modularization:** Sub-divided monolithic frontend templates into clean, feature-specific Handlebars partials, such as unifying the requirements checklist.
- **Real-Time Validations:** Form validations using active keystroke prevention restricting incorrect input values natively on the frontend.
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
