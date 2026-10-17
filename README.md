# Recruitment Selection Process (RSP)

A web-based system that digitizes the recruitment, selection and placement of personnel for the DepEd Division of Iligan City. It covers the full process: publishing vacancies, taking applications, evaluating and ranking applicants, generating official notices, and issuing assignment orders.

The system is made up of two Node.js applications that share one MySQL database:

- **RSP Dashboard** (`rsp-dashboard/`): the internal tool HR staff and evaluators use to run the five-step selection workflow.
- **RSP Portal** (`rsp-portal/`): the public site where applicants see open vacancies and submit applications.

---

## Table of Contents

- [Architecture](#architecture)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [npm Scripts](#npm-scripts)
- [Project Structure](#project-structure)
- [User Accounts and Roles](#user-accounts-and-roles)
- [Security](#security)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)
- [Changelog](#changelog)
- [License](#license)

---

## Architecture

| Application | Audience | Default port | Purpose |
| --- | --- | --- | --- |
| `rsp-dashboard` | HR staff, evaluators, administrators | `3000` | Vacancy setup, applicant evaluation (Steps 1–5), document generation, email dispatch, exports, backups, user management |
| `rsp-portal` | Applicants | `3001` | Lists open vacancies and accepts applications (`/`, `/apply/:type`, `POST /api/apply`) |

```
 Applicants ──▶ rsp-portal ──┐
                             ▼
                         MySQL (rsp_db)
                             ▲
 HR / Evaluators ──▶ rsp-dashboard ──▶ SMTP (bulk notices)
                             │
                             ├──▶ Word / LibreOffice (DOCX → PDF)
                             └──▶ Excel exports (CAR, IER, VER), backups
```

Both applications are server-rendered with Handlebars. The dashboard also exposes a JSON API under `/api` that its client-side scripts in `public/js/` call.

---

## Key Features

### Five-step selection workflow

| Step | Name | What happens |
| --- | --- | --- |
| 1 | Initial Evaluation | Check applicants against qualification standards (education, training, experience, eligibility, performance). Qualify or disqualify, and generate the Word evaluation notices. |
| 2 | Deliberation | Enter interview and assessment scores using built-in calculators (including the RPMS 10-point scale). Handles "No Appearance" and "Newly Promoted" cases. Protected by a separate `/step2-login`. |
| 3 | Comparative Assessment | Rank applicants by score and export the Comparative Assessment Result (CAR). |
| 4 | Requirements | Track submitted and missing requirements before assignment. |
| 5 | Assignment Orders | Generate Assignment Orders (Division Office or School-Based) as Word documents, with CC support. |

### Vacancies and positions
- 72 pre-mapped positions with salary grades, monthly salaries and editable qualification standards.
- Vacancy toggles (single, bulk, or a global "Off Vacancy" switch), plantilla item setup across multiple locations, and vacancy announcement numbers you can filter by on every tab.
- Request for Publication of Vacant Positions (VER) export that matches the official template.

### Documents and exports
- Word notices built from templates in `rsp-dashboard/public/templates/` using docxtemplater: Notice to Qualified, Notice to DQ, Notices of Requirements, Assignment Orders, and the Vacancy Endorsement.
- Server-side DOCX → PDF conversion through Microsoft Word (Windows) or LibreOffice (Windows/Linux). Generated files are cleaned up automatically, both when an applicant moves on and by a daily job.
- Excel exports for CAR, IER and VER built with ExcelJS and laid out for printing.

### Communication
- Bulk email dispatch through up to two SMTP accounts, with daily sending limits. Requests are split into chunks to avoid gateway timeouts.
- Cascading filters to choose which applicants and which notice template to send. Applicants still marked `PENDING` are left out automatically.

### Administration
- Role-based access control with three roles: Superadmin, Admin and Evaluator.
- Audit log of save, update, delete, proceed and download actions.
- Record locking with Server-Sent Events, so two users can't edit the same applicant at once. A lock is released as soon as its browser tab closes.
- Database backups as zipped JSON/CSV archives, downloaded on demand or created automatically each day.
- Metrics dashboard built with Chart.js.

---

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Runtime | Node.js, Express 5 |
| Views | Handlebars (`hbs`), Bootstrap 5, Bootstrap Icons, Choices.js, Chart.js, vanilla JavaScript |
| Database | MySQL / MariaDB via `mysql2` (connection pool) |
| Documents | `docxtemplater`, `pizzip`, `exceljs`, Microsoft Word or LibreOffice for PDF conversion |
| Email | `nodemailer` |
| Scheduling | `node-cron` |
| Security | `jsonwebtoken`, `helmet`, `cookie-parser`, scrypt password hashing |
| Logging and performance | `morgan`, `compression` |
| Development | `nodemon` |

---

## Prerequisites

- **Node.js**: a current LTS release.
- **MySQL 8** or **MariaDB 10.5+**.
- **Microsoft Word** (Windows) or **LibreOffice** (Windows or Linux), needed for PDF conversion of notices. On Windows, LibreOffice is looked for in the standard `C:\Program Files\LibreOffice\` locations. On Linux, the `libreoffice` command must be on `PATH`.
- **An SMTP account** for sending notices. For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833).

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd Recruitment-Selection-Process
```

### 2. Install dependencies

```bash
npm install --prefix rsp-dashboard
```

```bash
npm install --prefix rsp-portal
```

### 3. Configure environment variables

Copy each `.env.example` to `.env`, then fill in your database credentials, SMTP accounts and secrets (see [Configuration](#configuration)).

```bash
cp rsp-dashboard/.env.example rsp-dashboard/.env
```

```bash
cp rsp-portal/.env.example rsp-portal/.env
```

> **Note:** Both example files set `PORT=3000`. If you run both apps on the same machine, set `PORT=3001` (or any other free port) in `rsp-portal/.env`.

### 4. Initialize the database

Run these from `rsp-dashboard/`:

```bash
npm run db:init
```

```bash
npm run seedPositions
```

`db:init` creates the database and its tables from `seeders/database.sql`. `seedPositions` loads the position catalogue and its qualification standards.

To load test data, you can also seed about 1,000 mock applicants. This needs the dashboard server to be running.

```bash
npm run seedApplicants
```

> ⚠️ `npm run db:reset` **drops the whole database** and builds it again. Use it only in development.

### 5. Run the applications

For development with auto-reload:

```bash
npm run dev --prefix rsp-dashboard
```

```bash
npm run dev --prefix rsp-portal
```

For a normal (production) start:

```bash
npm start --prefix rsp-dashboard
```

```bash
npm start --prefix rsp-portal
```

Then open:

- Dashboard: <http://localhost:3000> (redirects to `/login`)
- Portal: <http://localhost:3001>

When the dashboard starts, it also creates missing columns and indexes and seeds the default user accounts (see [User Accounts and Roles](#user-accounts-and-roles)).

---

## Configuration

### Database and server (both apps)

| Variable | Default | Description |
| --- | --- | --- |
| `DB_HOST` | `127.0.0.1` | MySQL host |
| `DB_USER` | `root` | MySQL user |
| `DB_PASSWORD` | *(empty)* | MySQL password |
| `DB_NAME` | `rsp_db` | Database name (must be the same in both apps) |
| `PORT` | `3000` (dashboard), `3001` (portal) | HTTP port |

### Authentication and security (dashboard)

| Variable | Description |
| --- | --- |
| `NODE_ENV` | Set to `production` in production. This makes `JWT_SECRET` and `SUPERADMIN_PASSWORD` required and turns on HSTS. |
| `JWT_SECRET` | Secret used to sign login tokens. **Required** when `NODE_ENV=production`. Use a long random string. |
| `SUPERADMIN_USERNAME` | Superadmin username (default: `superadmin`). |
| `SUPERADMIN_PASSWORD` | Superadmin password. **Required** when `NODE_ENV=production`. |
| `ADMIN_PASSWORD` | Password given to the `admin` user when it is first created (default: `admin123`; change it after the first login). |
| `TRUST_PROXY` | Express `trust proxy` setting (default: `loopback`). Set it to match your reverse proxy. |
| `DB_CONNECTION_LIMIT` | Maximum number of MySQL pool connections (default: `20`). |

### Email (dashboard)

Up to two sending accounts are supported. Replace `n` with `1` or `2`.

| Variable | Description |
| --- | --- |
| `SMTP_HOST_n` | SMTP server (e.g. `smtp.gmail.com`) |
| `SMTP_PORT_n` | SMTP port (e.g. `587`) |
| `SMTP_USER_n` | Sender account |
| `SMTP_PASS_n` | Account password or app password |
| `SMTP_GMAILNAME_n` | Display name shown as the sender |
| `DAILY_EMAIL_LIMIT1`, `DAILY_EMAIL_LIMIT2` | Optional daily sending limit for each account |

> Never commit `.env` files. They are already listed in `.gitignore`.

---

## npm Scripts

### `rsp-dashboard`

| Script | Description |
| --- | --- |
| `npm run dev` | Start with `nodemon`, reloading on `.js`, `.hbs`, `.json` and `.css` changes |
| `npm start` | Start the server |
| `npm run db:init` | Create the database and tables if they don't exist |
| `npm run db:reset` | **Drop** the database and create it again |
| `npm run seedPositions` | Seed the position catalogue and qualification standards |
| `npm run seedApplicants` | Open sample vacancies and seed about 1,000 mock applicants |

### `rsp-portal`

| Script | Description |
| --- | --- |
| `npm run dev` | Start with `nodemon` |
| `npm start` | Start the server |

---

## Project Structure

```
Recruitment-Selection-Process/
├── rsp-dashboard/                 # Admin dashboard (Express + Handlebars)
│   ├── server.js                  # App entry: middleware, startup migrations, user seeding, cron jobs
│   ├── db.js                      # MySQL connection pool
│   ├── controllers/               # Applicant, auth, position and view controllers
│   ├── routes/                    # Page routes, JSON API, Excel export routes (CAR, IER, VER)
│   ├── middleware/                # JWT authentication and role checks
│   ├── utils/                     # Security, backups, PDF generation, DOCX conversion, Excel builders
│   │   └── templates/             # Excel templates (CAR, IER)
│   ├── seeders/                   # database.sql, initDb, position/applicant seeders, unseed
│   ├── templates_xml/             # Raw Word XML fragments used in notices
│   ├── views/                     # Handlebars pages
│   │   └── partials/              # Step views (step1–step5), dashboard tabs, modals
│   └── public/
│       ├── js/                    # Client-side scripts (dashboard, wizard, document makers, ...)
│       ├── css/                   # Stylesheets
│       ├── templates/             # Word templates for notices and assignment orders
│       └── generated_notices/     # Temporary output for generated documents (not served publicly)
├── rsp-portal/                    # Applicant portal (Express + Handlebars)
│   ├── server.js                  # Vacancy listing and application endpoint
│   ├── db.js                      # MySQL connection pool
│   ├── views/                     # Home, application form, layout
│   └── public/                    # Client scripts, styles, logos
├── CHANGELOG.md                   # Release history
└── README.md
```

---

## User Accounts and Roles

When the dashboard starts, it makes sure these accounts exist:

| Username | Role | Initial password |
| --- | --- | --- |
| `SUPERADMIN_USERNAME` (default `superadmin`) | Superadmin | `SUPERADMIN_PASSWORD` |
| `admin` | Admin | `ADMIN_PASSWORD` (default `admin123`) |

| Role | Access |
| --- | --- |
| **Superadmin** | Full access, including managing Admin accounts. Superadmin activity is kept out of the audit log. |
| **Admin** | Manages vacancies, applicants, documents and Evaluator accounts. Can't create or edit Admin or Superadmin accounts. |
| **Evaluator** | Works on the evaluation steps they have been given access to. Step 2 (and therefore Step 3) needs the `can_access_step2` permission. |

> Change the default passwords right after the first login. In production the dashboard won't start until `JWT_SECRET` and `SUPERADMIN_PASSWORD` are set.

---

## Security

- **Passwords** are hashed with salted scrypt (`utils/security.js`). Older SHA-256 hashes still work and are upgraded automatically on the next successful login.
- **Sessions** use signed JWTs stored in `sameSite` cookies.
- **HTTP hardening**: `helmet` security headers, with HSTS turned on in production.
- **Rate limiting** on `/login`, `/step2-login` and the portal's `/api/apply`.
- **File safety**: backup downloads are protected against path traversal, and `/generated_notices` is not served publicly.
- **Process safety**: Word and LibreOffice are called with file paths passed as arguments, never through a shell command string. A conversion that hangs only kills the Word process it started.
- **Error handling**: the portal never returns raw database errors to applicants. A final error handler returns JSON for `/api` routes and plain text for pages.
- **Request size**: request bodies are limited to 5 MB, except for the DOCX-to-PDF upload, which allows 50 MB.
- **Data integrity**: creating an applicant runs in a single transaction.

---

## Production Deployment

1. Set `NODE_ENV=production`, a strong `JWT_SECRET` and a strong `SUPERADMIN_PASSWORD`.
2. Run both apps under a process manager or system service so they restart after crashes and reboots. The dashboard shuts down cleanly on `SIGINT`/`SIGTERM`.
3. Put them behind a reverse proxy (e.g. Nginx or IIS) that handles HTTPS, and set `TRUST_PROXY` to match it.
4. Install Microsoft Word or LibreOffice on the dashboard server so notices can be converted to PDF.
5. Make sure the dashboard can write to `public/generated_notices/` and to its backup folder.
6. Check that the automatic daily backups are being created, and copy them somewhere off the server.

---

## Troubleshooting

| Problem | What to check |
| --- | --- |
| PDF conversion fails | Make sure Microsoft Word or LibreOffice is installed. On Linux, `libreoffice` must be on `PATH`. On Windows, close any Word dialogs that are blocking automation. |
| `EADDRINUSE` on startup | Both apps are trying to use the same port. Set a different `PORT` in `rsp-portal/.env`. |
| Can't connect to the database | Make sure MySQL is running, the `DB_*` values are correct in both `.env` files, and you have run `npm run db:init`. |
| Emails fail to send | Check the `SMTP_*` values. Gmail requires an App Password when 2-Step Verification is on. Check whether the daily limit was reached. |
| Page looks stale or won't load on `localhost` | An old Service Worker from another project on the same port may be caching responses. Unregister it in your browser's DevTools (Application → Service Workers) and reload. |
| Production start fails with a security error | Set `JWT_SECRET` and `SUPERADMIN_PASSWORD` in `.env`. |

---

## Changelog

Recent highlights:

- **Security hardening**: scrypt password hashing, required production secrets, helmet headers, rate limiting, path-traversal protection, and safer document conversion.
- **Performance**: removed N+1 queries, batched inserts, ran queries in parallel, cached DOCX templates, and added indexes that are created automatically.
- **Smaller dashboard page**: the `/dashboard` HTML dropped from about 2.6 MB to about 240 KB. Vacancy Setup rows now load on demand from `GET /api/positions/vacancy-setup`.
- **Reliability**: applicant creation runs in a transaction, plus a final error handler, clean shutdown, and a configurable DB pool size.
- **Documents**: generated notice filenames now include the applicant's name, position code, increment and vacancy number.

For the full release history, see [CHANGELOG.md](CHANGELOG.md) and [rsp-dashboard/CHANGELOG.md](rsp-dashboard/CHANGELOG.md).

---

## License

Released under the ISC license, as declared in each application's `package.json`. The official templates, logos and seals in this repository belong to the Department of Education and are included for use by the Division of Iligan City only.
