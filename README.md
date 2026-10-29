<a id="top"></a>

<div align="center">

<img src="rsp-dashboard/public/images/rsp-logo.png" alt="RSP logo" width="120" />

# Recruitment, Selection &amp; Placement System

**A digital RSP workflow for the DepEd Division of Iligan City, from vacancy posting to assignment order.**

<p>
  <img src="https://img.shields.io/badge/Node.js-22.14.0-339933?style=flat-square" alt="Node.js 22.14.0" />
  <img src="https://img.shields.io/badge/Express-5.2.1-000000?style=flat-square" alt="Express 5.2.1" />
  <img src="https://img.shields.io/badge/Handlebars_%28hbs%29-4.2.1-F0772B?style=flat-square" alt="Handlebars (hbs) 4.2.1" />
  <img src="https://img.shields.io/badge/Bootstrap-5.3.8-7952B3?style=flat-square" alt="Bootstrap 5.3.8" />
  <img src="https://img.shields.io/badge/MySQL-8.0.41-4479A1?style=flat-square" alt="MySQL 8.0.41" />
</p>

<p>
  <img src="https://img.shields.io/badge/version-1.0.0-blue?style=flat-square" alt="Version 1.0.0" />
  <img src="https://img.shields.io/badge/license-ISC-green?style=flat-square" alt="License ISC" />
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20Linux-lightgrey?style=flat-square&logo=windows" alt="Platform" />
  <img src="https://img.shields.io/badge/deployment-portal%20online%20%C2%B7%20dashboard%20local-orange?style=flat-square" alt="Deployment model" />
</p>

[Architecture](#-architecture) ·
[Features](#-key-features) ·
[Getting Started](#-getting-started) ·
[Deployment](#-deployment-online-portal-local-dashboard) ·
[Security](#-security)

</div>

---

## 📖 Overview

The system digitizes the recruitment, selection and placement of personnel for the DepEd Division of Iligan City. It covers the whole process: publishing vacancies, taking applications, evaluating and ranking applicants, generating official notices, and issuing assignment orders.

It is made up of two Node.js applications that share one MySQL database:

| | Application | Who uses it | Where it runs |
| :---: | --- | --- | --- |
| 🌐 | **RSP Portal** (`rsp-portal/`) | Applicants, from home | **Online**, published through a Cloudflare Tunnel |
| 🛡️ | **RSP Dashboard** (`rsp-dashboard/`) | HR staff and evaluators | **Local**, on the office LAN only and never exposed to the internet |

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Deployment: Online Portal, Local Dashboard](#-deployment-online-portal-local-dashboard)
- [Configuration](#%EF%B8%8F-configuration)
- [Usage](#-usage)
- [npm Scripts](#-npm-scripts)
- [Project Structure](#-project-structure)
- [User Accounts and Roles](#-user-accounts-and-roles)
- [Security](#-security)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [Changelog](#-changelog)
- [License](#-license)
- [Author](#-author)

---

## 🏗️ Architecture

| Application | Audience | Default bind | Purpose |
| --- | --- | --- | --- |
| `rsp-portal` | Applicants | `127.0.0.1:3001` | Lists open vacancies and accepts applications (`/`, `/apply/:type`, `POST /api/apply`) |
| `rsp-dashboard` | HR staff, evaluators, administrators | `0.0.0.0:3000` (LAN) | Vacancy setup, applicant evaluation (Steps 1–5), document generation, email dispatch, exports, backups, user management |

```
                       INTERNET                        │                OFFICE PC / LAN
                                                       │
 Applicants (home) ──HTTPS──▶ Cloudflare ◀──outbound tunnel── cloudflared
                                                       │          │
                                                       │          ▼
                                                       │   rsp-portal 127.0.0.1:3001
                                                       │          │  (insert-only DB user)
                                                       │          ▼
                                                       │   MySQL 127.0.0.1:3306 (rsp_db)
                                                       │          ▲
                                                       │          │
                              HR / Evaluators (LAN) ───┼──▶ rsp-dashboard :3000 ──▶ SMTP (notices)
                                                       │          ├──▶ Word / LibreOffice (DOCX → PDF)
                                                       │          └──▶ Excel exports, backups
```

Both applications are server-rendered with Handlebars. The dashboard also exposes a JSON API under `/api`, which its client-side scripts in `public/js/` call.

<p align="right"><a href="#top">⬆ back to top</a></p>

---

## ✨ Key Features

### 🧭 Five-step selection workflow

| Step | Name | What happens |
| :---: | --- | --- |
| 1 | **Initial Evaluation** | Applicants are checked against qualification standards (education, training, experience, eligibility, performance). Staff qualify or disqualify them and generate the Word evaluation notices. |
| 2 | **Deliberation** | Interview and assessment scores are entered with built-in calculators, including the RPMS 10-point scale. "No Appearance" and "Newly Promoted" cases are handled. This step is protected by a separate `/step2-login`. |
| 3 | **Comparative Assessment** | Applicants are ranked by score, and the Comparative Assessment Result (CAR) is exported. |
| 4 | **Requirements** | Submitted and missing requirements are tracked before assignment. |
| 5 | **Assignment Orders** | Assignment Orders are generated as Word documents, for either the Division Office or School-Based, with CC support. |

### 📌 Vacancies and positions
- **72 pre-mapped positions**, each with its salary grade and monthly salary, and with qualification standards you can edit.
- **Vacancy toggles**: turn vacancies on or off one at a time, in bulk, or all at once with a global "Off Vacancy" switch.
- **Plantilla items** can be set up across multiple locations.
- **Vacancy announcement numbers** work as a filter on every tab.
- **Request for Publication of Vacant Positions (VER)** export that matches the official template.

### 📄 Documents and exports
- **Word notices** are built with docxtemplater from the templates in `rsp-dashboard/public/templates/`. They include Notice to Qualified, Notice to DQ, Notices of Requirements, Assignment Orders and the Vacancy Endorsement.
- **PDF conversion** from DOCX happens on the server through Microsoft Word or LibreOffice. Generated files are cleaned up automatically, both when an applicant moves on and by a daily job.
- **Excel exports** for CAR, IER and VER are built with ExcelJS and laid out for printing.

### ✉️ Communication
- **Bulk email** is sent through up to two SMTP accounts with daily sending limits. Large batches are sent in chunks so the request doesn't time out.
- **Cascading filters** let you pick which applicants and which notice template to send. Applicants who are still `PENDING` are left out automatically.

### 🛠️ Administration
- **Role-based access** with three roles: Superadmin, Admin and Evaluator.
- **Audit log** of save, update, delete, proceed and download actions.
- **Record locking** with Server-Sent Events, so two users can't edit the same applicant at once.
- **Backups**: database backups are saved as zipped JSON/CSV archives, either on demand or automatically each day.
- **Metrics dashboard** built with Chart.js.

<p align="right"><a href="#top">⬆ back to top</a></p>

---

## 🧰 Tech Stack

| Layer | Versions |
| --- | --- |
| Runtime and server | ![Node.js](https://img.shields.io/badge/Node.js-22.14.0-339933?style=flat-square) ![Express](https://img.shields.io/badge/Express-5.2.1-000000?style=flat-square) ![nodemon](https://img.shields.io/badge/nodemon-3.1.14-76D04B?style=flat-square) |
| Front end | ![Handlebars](https://img.shields.io/badge/Handlebars_%28hbs%29-4.2.1-F0772B?style=flat-square) ![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3.8-7952B3?style=flat-square) ![Bootstrap Icons](https://img.shields.io/badge/Bootstrap_Icons-1.13.1-7952B3?style=flat-square) ![Chart.js](https://img.shields.io/badge/Chart.js-4.5.1-FF6384?style=flat-square) ![Choices.js](https://img.shields.io/badge/Choices.js-11.2.3-00A5BB?style=flat-square) |
| Data | ![MySQL](https://img.shields.io/badge/MySQL-8.0.41-4479A1?style=flat-square) ![mysql2](https://img.shields.io/badge/mysql2-3.22.5-4479A1?style=flat-square) |
| Documents and email | ![docxtemplater](https://img.shields.io/badge/docxtemplater-3.69.0-2B579A?style=flat-square) ![ExcelJS](https://img.shields.io/badge/ExcelJS-4.4.0-217346?style=flat-square) ![Nodemailer](https://img.shields.io/badge/Nodemailer-9.0.3-22B573?style=flat-square) ![node-cron](https://img.shields.io/badge/node--cron-4.6.0-555555?style=flat-square) |
| Security and hosting | ![jsonwebtoken](https://img.shields.io/badge/jsonwebtoken-9.0.3-D63AFF?style=flat-square) ![helmet](https://img.shields.io/badge/helmet-8.3.0-0F172A?style=flat-square) ![Cloudflare Tunnel](https://img.shields.io/badge/Cloudflare_Tunnel-cloudflared-F38020?style=flat-square) |

Versions are the ones installed on the office PC. Supported minimums are Node.js LTS and MySQL 8 / MariaDB 10.5+.

<details>
<summary><b>Full dependency breakdown</b></summary>

| Layer | Technologies |
| --- | --- |
| Runtime | Node.js, Express 5 |
| Views | Handlebars (`hbs`), Bootstrap 5, Bootstrap Icons, Choices.js, Chart.js, vanilla JavaScript |
| Database | MySQL / MariaDB via `mysql2` (connection pool) |
| Documents | `docxtemplater`, `pizzip`, `exceljs`, Microsoft Word or LibreOffice for PDF conversion |
| Email | `nodemailer` |
| Scheduling | `node-cron` |
| Security | `jsonwebtoken`, `helmet` (both apps), `cookie-parser`, scrypt password hashing |
| Logging and performance | `morgan`, `compression` |
| Hosting | Cloudflare Tunnel (`cloudflared`) for the public portal |
| Development | `nodemon` |

</details>

<p align="right"><a href="#top">⬆ back to top</a></p>

---

## 📋 Prerequisites

- **Node.js**: a current LTS release.
- **MySQL 8** or **MariaDB 10.5+**.
- **Microsoft Word** (Windows) or **LibreOffice** (Windows or Linux), needed to convert notices to PDF.
  - On Windows, LibreOffice is found automatically in the standard `C:\Program Files\LibreOffice\` locations.
  - On Linux, `libreoffice` must be on `PATH`.
- **An SMTP account** for sending notices. For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833).
- **To publish the portal online**:
  - A free [Cloudflare](https://dash.cloudflare.com/sign-up) account.
  - A domain added to that account.
  - `cloudflared` installed on the office PC.

---

## 🚀 Getting Started

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

Copy each `.env.example` to `.env`, then fill in the values (see [Configuration](#%EF%B8%8F-configuration)).

```bash
cp rsp-dashboard/.env.example rsp-dashboard/.env
```

```bash
cp rsp-portal/.env.example rsp-portal/.env
```

> [!NOTE]
> The dashboard uses port `3000` and the portal uses port `3001`. If your existing `rsp-portal/.env` still says `PORT=3000`, change it to `3001`.

### 4. Initialize the database

Run these from `rsp-dashboard/`:

```bash
npm run db:init
```

```bash
npm run seedPositions
```

- `db:init` creates the database and its tables from `seeders/database.sql`.
- `seedPositions` loads the position catalogue and qualification standards.

You can also seed about 1,000 mock applicants for testing. The dashboard must be running first.

```bash
npm run seedApplicants
```

> [!WARNING]
> `npm run db:reset` **drops the whole database** and builds it again. Use it only in development.

### 5. Run the applications

```bash
npm run dev --prefix rsp-dashboard
```

```bash
npm run dev --prefix rsp-portal
```

Use `npm start` instead of `npm run dev` for a normal (production) start. Then open:

- **Dashboard**: <http://localhost:3000>, which redirects to `/login`.
- **Portal**: <http://localhost:3001>.

When the dashboard starts, it adds any missing columns and indexes and seeds the default user accounts (see [User Accounts and Roles](#-user-accounts-and-roles)).

<p align="right"><a href="#top">⬆ back to top</a></p>

---

## 🌐 Deployment: Online Portal, Local Dashboard

The goal: **applicants apply and submit their document links from home, while the whole RSP process stays inside the office.**

How it works:
- The portal runs on the office PC next to MySQL, listening only on `127.0.0.1`.
- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) opens an **outbound** connection from the office PC to Cloudflare and publishes **only the portal**.
- There is no router port-forwarding and no public IP, and no inbound port is opened.
- The dashboard and MySQL are never published. The dashboard is reachable only from the office LAN.

| Component | Reachable from | How it is enforced |
| --- | --- | --- |
| Portal (`:3001`) | The internet, via `https://apply.<your-domain>` | Binds to `127.0.0.1`; only `cloudflared` forwards traffic to it |
| Dashboard (`:3000`) | Office LAN only | Windows Firewall rule allows `LocalSubnet` only; not in the tunnel config |
| MySQL (`:3306`) | This PC only | `bind-address = 127.0.0.1`; firewall blocks remote connections |

> [!IMPORTANT]
> The office PC (with MySQL, the portal and `cloudflared`) must stay **on and connected** while applications are open. If it's off, applicants see a Cloudflare error page.

### Step 1: Create a least-privilege database user for the portal

Edit the password in [`deploy/portal-db-user.sql`](deploy/portal-db-user.sql), then run:

```bash
mysql -u root -p < deploy/portal-db-user.sql
```

Then set `DB_USER=rsp_portal` and the new `DB_PASSWORD` in `rsp-portal/.env`.

This user can only **insert** new applications. It cannot read applicant details, scores, users or logs, and it cannot delete anything. Even if the public portal is compromised, the RSP data stays safe.

### Step 2: Install cloudflared

```bash
winget install --id Cloudflare.cloudflared
```

### Step 3: Create the tunnel

Run these one at a time. The first opens a browser so you can sign in to Cloudflare and pick your domain.

```bash
cloudflared tunnel login
```

```bash
cloudflared tunnel create rsp-portal
```

```bash
cloudflared tunnel route dns rsp-portal apply.your-domain.com
```

### Step 4: Configure the tunnel and run it as a Windows service

1. Copy [`deploy/cloudflared-config.example.yml`](deploy/cloudflared-config.example.yml) to `%USERPROFILE%\.cloudflared\config.yml`.
2. Fill in the tunnel ID, the credentials file path and your hostname. The config publishes only `http://127.0.0.1:3001` and returns 404 for everything else.
3. Install the service from an **Administrator** terminal, so the tunnel starts with Windows:

```bash
cloudflared service install
```

### Step 5: Keep both apps running

Run both apps under a process manager so they restart after crashes and reboots. For example, with [pm2](https://pm2.keymetrics.io/):

```bash
npm install -g pm2 pm2-windows-startup
```

```bash
pm2 start rsp-dashboard/server.js --name rsp-dashboard --cwd rsp-dashboard
```

```bash
pm2 start rsp-portal/server.js --name rsp-portal --cwd rsp-portal
```

```bash
pm2 save
```

```bash
pm2-startup install
```

### Step 6: Lock down the dashboard and MySQL

From an **Administrator** PowerShell:

```bash
powershell -ExecutionPolicy Bypass -File deploy/firewall-dashboard-lan.ps1
```

Then:
- Set `bind-address = 127.0.0.1` under `[mysqld]` in MySQL's `my.ini` and restart the MySQL service.
- Set the office network profile to **Private** in Windows Settings.

### Step 7: Verify

1. On a phone using **mobile data** (not office Wi-Fi), open `https://apply.your-domain.com`. The portal should load.
2. Submit a test application and confirm it appears in the dashboard.
3. From outside the office network, `http://<office-public-ip>:3000` and `:3001` must **not** respond.

<details>
<summary><b>No domain yet? Quick test URL</b></summary>

For a short test, you can get a temporary random `*.trycloudflare.com` address without an account:

```bash
cloudflared tunnel --url http://127.0.0.1:3001
```

The address changes every time the command is restarted, so use a named tunnel (Steps 3–4) for the real application period.

</details>

<p align="right"><a href="#top">⬆ back to top</a></p>

---

## ⚙️ Configuration

### Database and server (both apps)

| Variable | Default | Description |
| --- | --- | --- |
| `DB_HOST` | `127.0.0.1` | MySQL host |
| `DB_USER` | `root` | MySQL user. Use `rsp_portal` for the portal (see [Deployment](#-deployment-online-portal-local-dashboard)). |
| `DB_PASSWORD` | *(empty)* | MySQL password |
| `DB_NAME` | `rsp_db` | Database name. Must be the same in both apps. |
| `PORT` | `3000` (dashboard), `3001` (portal) | HTTP port |
| `HOST` | `0.0.0.0` (dashboard), `127.0.0.1` (portal) | Address to listen on. Keep the portal on `127.0.0.1` so it can only be reached through the tunnel. Set the dashboard to `127.0.0.1` to allow this PC only. |
| `NODE_ENV` | — | Set to `production` in production. This turns on HSTS in both apps and makes the dashboard secrets required. |
| `TRUST_PROXY` | `loopback` | Express `trust proxy` setting. With `loopback`, the portal reads the real applicant IP that `cloudflared` forwards, so rate limiting works per applicant. |

### Authentication and security (dashboard)

| Variable | Description |
| --- | --- |
| `JWT_SECRET` | Secret used to sign login tokens. In production it must be a random string of **at least 32 characters**; the dashboard refuses to start with a missing, placeholder or short value. Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`. |
| `SUPERADMIN_USERNAME` | Superadmin username (default: `superadmin`). |
| `SUPERADMIN_PASSWORD` | Superadmin password. **Required.** In production it must be at least 12 characters and not a default such as `superadmin`, or the dashboard won't start. |
| `ADMIN_PASSWORD` | Optional. When set, an `admin` user is created with this password on first start. When empty, no `admin` user is created. |
| `COOKIE_SECURE` | `true` only when the dashboard is served over HTTPS. Keep `false` for plain-HTTP LAN installs, otherwise browsers drop the login cookie. |
| `DB_CONNECTION_LIMIT` | Maximum number of MySQL pool connections (default: `20`). |

<details>
<summary><b>Email (dashboard)</b></summary>

Up to two sending accounts are supported. Replace `n` with `1` or `2`.

| Variable | Description |
| --- | --- |
| `SMTP_HOST_n` | SMTP server (e.g. `smtp.gmail.com`) |
| `SMTP_PORT_n` | SMTP port (e.g. `587`) |
| `SMTP_USER_n` | Sender account |
| `SMTP_PASS_n` | Account password or app password |
| `SMTP_GMAILNAME_n` | Display name shown as the sender |
| `DAILY_EMAIL_LIMIT1`, `DAILY_EMAIL_LIMIT2` | Optional daily sending limit for each account |

</details>

> [!CAUTION]
> Never commit `.env` files. They are already listed in `.gitignore`.

---

## 💡 Usage

### For applicants (RSP Portal)

1. Open the portal, e.g. `https://apply.your-domain.com` (or <http://localhost:3001> locally).
2. Choose **Internal** (current DepEd employee) or **External** (new applicant). Then pick the category, district and position. The browser goes to a URL like:
   ```
   /apply/external?position=Teacher+I&positionCategory=Teaching&district=...&category=...
   ```
3. Fill in the tabs: **Personal Information**, **Education**, **Training**, **Experience** and **Eligibility**.
   - Documents are submitted as **links**, not file uploads. Upload the PDS and certificates to Google Drive (or any cloud storage), set sharing to "Anyone with the link can view", and paste the URLs.
4. Submit, then save the **Tracking Number** that is shown. It looks like `T1-2026-15`: the position code, the year, then a running number.

<details>
<summary><b>Example API request</b> (what the form sends to <code>POST /api/apply</code>)</summary>

```json
{
  "type": "external",
  "first_name": "Juan", "middle_name": "Santos", "last_name": "Dela Cruz",
  "position": "Teacher I", "positionCategory": "Teaching", "district": "District 1", "category": "Elementary",
  "email_address": "juan@example.com", "contact_no": "09171234567",
  "pds_link": "https://drive.google.com/...",
  "education": "[{\"degree\":\"BEEd\",\"year\":\"2024\",\"link\":\"https://drive.google.com/...\"}]",
  "training": "[]", "experience": "[]", "eligibility": "[{\"details\":\"LET\",\"rating\":\"85.2\",\"link\":\"\"}]"
}
```

Response: `{ "success": true, "applicationCode": "T1-2026-15" }`. It returns `429` after 20 submissions from one IP within 15 minutes.

</details>

### For HR staff and evaluators (RSP Dashboard)

1. On an office PC, open `http://<office-pc-ip>:3000` and sign in.
2. **Vacancy Setup**: turn on the positions being filled, set their plantilla items, and set the vacancy announcement number. Export the **VER** to request publication.
3. Work through the five steps for each applicant:
   - **Step 1**: qualify or disqualify, then generate the notices.
   - **Step 2**: enter the scores. This needs `/step2-login`.
   - **Step 3**: rank the applicants and export the **CAR**.
   - **Step 4**: track the requirements.
   - **Step 5**: generate the **Assignment Orders**.
4. Send the notices in bulk from the email dispatch screen. Use **Backup** to download an archive of the database.

<p align="right"><a href="#top">⬆ back to top</a></p>

---

## 📜 npm Scripts

| App | Script | Description |
| --- | --- | --- |
| dashboard | `npm run dev` | Start with `nodemon`, reloading on `.js`, `.hbs`, `.json` and `.css` changes |
| dashboard | `npm start` | Start the server |
| dashboard | `npm run db:init` | Create the database and tables if they don't exist |
| dashboard | `npm run db:reset` | **Drop** the database and create it again |
| dashboard | `npm run seedPositions` | Seed the position catalogue and qualification standards |
| dashboard | `npm run seedApplicants` | Open sample vacancies and seed about 1,000 mock applicants |
| portal | `npm run dev` | Start with `nodemon` |
| portal | `npm start` | Start the server |

<p align="right"><a href="#top">⬆ back to top</a></p>

---

## 🗂️ Project Structure

```
Recruitment-Selection-Process/
├── rsp-dashboard/                 # Admin dashboard (Express + Handlebars), LAN only
│   ├── server.js                  # Entry point: middleware, startup migrations, user seeding, cron jobs
│   ├── db.js                      # MySQL connection pool
│   ├── controllers/               # Applicant, auth, position and view controllers
│   ├── routes/                    # Page routes, JSON API, Excel export routes (CAR, IER, VER)
│   ├── middleware/                # JWT authentication and role checks
│   ├── utils/                     # Security, backups, PDF generation, DOCX conversion, Excel builders
│   ├── seeders/                   # database.sql, initDb, position/applicant seeders, unseed
│   ├── templates_xml/             # Raw Word XML fragments used in notices
│   ├── views/                     # Handlebars pages and partials (step1–step5, tabs, modals)
│   └── public/                    # Client scripts, styles, Word templates, generated notices
├── rsp-portal/                    # Applicant portal (Express + Handlebars), published online
│   ├── server.js                  # Vacancy listing and application endpoint
│   ├── db.js                      # MySQL connection pool
│   ├── views/                     # Home, application form, layout
│   └── public/                    # Client scripts, styles, logos
├── deploy/                        # Online-portal / local-dashboard deployment
│   ├── portal-db-user.sql         # Least-privilege MySQL user for the portal
│   ├── cloudflared-config.example.yml  # Tunnel config that publishes only the portal
│   └── firewall-dashboard-lan.ps1 # Windows Firewall: dashboard LAN-only, MySQL local-only
├── CHANGELOG.md                   # Release history
└── README.md
```

---

## 👥 User Accounts and Roles

When the dashboard starts, it makes sure these accounts exist:

| Username | Role | Initial password |
| --- | --- | --- |
| `SUPERADMIN_USERNAME` (default `superadmin`) | Superadmin | `SUPERADMIN_PASSWORD` |
| `admin` | Admin | `ADMIN_PASSWORD` (only created when it is set) |

| Role | Access |
| --- | --- |
| 🔑 **Superadmin** | Full access, including managing Admin accounts. Superadmin activity is kept out of the audit log. |
| 🧑‍💼 **Admin** | Manages vacancies, applicants, documents and Evaluator accounts. Only admins can add or edit positions, turn vacancies on or off, delete applicants, download backups, send bulk emails and convert DOCX to PDF on the server. |
| 📝 **Evaluator** | Works on the evaluation steps they have been given. Step 2 (and therefore Step 3) needs the `can_access_step2` permission or a Step 2 unlock. This rule is enforced on the API too, not just on the pages. |

Role and permission changes take effect on the user's next request, and deleting a user signs them out immediately. Sessions last 12 hours.

> [!IMPORTANT]
> In production the dashboard won't start until `JWT_SECRET` is a long random value and `SUPERADMIN_PASSWORD` is strong (see [Configuration](#%EF%B8%8F-configuration)).

<p align="right"><a href="#top">⬆ back to top</a></p>

---

## 🔒 Security

### Network isolation
- Only the portal is published, through an outbound Cloudflare Tunnel.
- The dashboard is LAN-only and MySQL is local-only. No router ports are opened.

### Least privilege
- The portal connects as `rsp_portal`, which can only insert applications.

### Passwords and sessions
- Passwords are hashed with salted scrypt (`utils/security.js`).
- Older SHA-256 hashes still work and are upgraded automatically on the next successful login.
- Sessions use signed JWTs stored in `httpOnly`, `sameSite` cookies that expire after 12 hours.
- Every request reloads the user's role and Step 2 permission from the database, so demoted or deleted users lose access at once.
- Production refuses to start with a placeholder or short `JWT_SECRET` or a weak `SUPERADMIN_PASSWORD`. There are no built-in default passwords.
- Logout is a `POST`, and login pages only show fixed error messages, so crafted links can't sign users out or show fake text.

### Access control
- Admin-only API routes: positions and vacancies, deleting applicants, backups, bulk email and DOCX-to-PDF conversion.
- Step 2 and Step 3 API actions (assess, no appearance, newly promoted, proceed to requirements) need Step 2 access, the same as the pages.

### Cross-site scripting (XSS)
- Applicant data comes from the public portal, so it is escaped everywhere the dashboard builds HTML: `escapeHtml()` and `jsArg()` in `public/js/utils.js`, and the `jsArg` Handlebars helper for inline `onclick` arguments.
- Toasts render plain text.
- Names in outgoing email HTML are escaped.
- Document links are only rendered when they start with `http://` or `https://`.

### HTTP hardening
- Both apps send `helmet` security headers, with HSTS turned on in production.
- `/login`, `/step2-login` and the portal's `/api/apply` are rate-limited. Behind the tunnel, limits apply per real applicant IP.
- Request size is limited: 1 MB for the portal and 5 MB for the dashboard (50 MB for the DOCX-to-PDF upload).

### File and process safety
- Backup downloads are protected against path traversal.
- Generated notice file names are built from letters and digits only (`utils/noticeNames.js`), so an application code can never point outside `generated_notices`.
- CSV backups prefix values starting with `=`, `+`, `-` or `@` with `'`, so spreadsheet apps don't run them as formulas.
- The server-side PDF converter only accepts real `.docx` files.
- `/generated_notices` is not served publicly.
- Word and LibreOffice are called with file paths as arguments, never through a shell command string.

### Public portal
- Every application is validated on the server (`rsp-portal/lib/validateApplication.js`): required fields, lengths, email and phone formats, age, allowed positions and districts, at most 20 entries per list, and `http(s)` links only.
- The tracking code is always generated by the server; a code sent by the browser is ignored.
- A strict Content Security Policy is on, with no inline scripts.
- Behind the tunnel, rate limiting uses the real visitor IP from `CF-Connecting-IP`.
- Unknown pages and server errors show a friendly error page.

### Error handling
- The portal never returns raw database errors to applicants.
- Creating an applicant runs in a single transaction.

---

## 🧪 Testing

The project has no automated test suite yet. Before releasing a change, run these manual checks.

| Area | Check |
| --- | --- |
| Syntax | `node --check rsp-dashboard/server.js` and `node --check rsp-portal/server.js` |
| Portal | Submit a test application at <http://localhost:3001>. A tracking number appears, and the applicant shows up in the dashboard. |
| Portal binding | `netstat -ano \| findstr :3001` shows `127.0.0.1:3001` only. |
| Security headers | `curl -I http://127.0.0.1:3001/` includes `X-Content-Type-Options: nosniff`. |
| Rate limit | The 21st `POST /api/apply` from one IP within 15 minutes returns `429`. |
| Portal validation | An empty form shows inline errors. A list with 21 entries, or a `javascript:` link, is rejected with `400`. `/nope` shows the 404 page. |
| Dashboard | Sign in, then move a test applicant through Steps 1–5 and generate each notice, the CAR, the IER and the VER. |
| Roles | As an evaluator, `DELETE /api/applicants/:id` and `GET /api/export/backup` return `403`. Without Step 2 access, `POST /api/applicants/:id/assess` returns `401`. |
| XSS | A test applicant named `<img src=x onerror=alert(1)>` shows as plain text in every list and modal. |
| Secrets | With `NODE_ENV=production` and a weak `SUPERADMIN_PASSWORD`, `npm start` stops with a security error. |
| Deployment | From mobile data, the portal URL loads. `http://<office-public-ip>:3000` does not respond. |

For test data, run `npm run seedApplicants` against a **development** database.

> [!WARNING]
> `node seeders/unseed.js` **empties every table**: applicants, positions, logs and email logs. It doesn't remove only the test data. Never run it against the real database.

<p align="right"><a href="#top">⬆ back to top</a></p>

---

## 🩺 Troubleshooting

| Problem | What to check |
| --- | --- |
| Applicants see a Cloudflare **502 / 1033** error | The office PC is off, the portal isn't running on `127.0.0.1:3001`, or the `cloudflared` service has stopped. Run `pm2 status` and check **Services → Cloudflared**. |
| Other office PCs can't open the dashboard | Make sure `HOST=0.0.0.0` in `rsp-dashboard/.env`, that the firewall script has run, and that the network profile is **Private**. Use `http://<office-pc-ip>:3000`. |
| Portal submissions fail with a permission error | `deploy/portal-db-user.sql` hasn't been run, or the portal `.env` points at the wrong user or password. |
| PDF conversion fails | Make sure Microsoft Word or LibreOffice is installed, and close any Word dialogs that are blocking automation. |
| `EADDRINUSE` on startup | Both apps are using the same port. Set `PORT=3001` in `rsp-portal/.env`. |
| Can't connect to the database | Make sure MySQL is running, the `DB_*` values are correct, and you have run `npm run db:init`. |
| Emails fail to send | Check the `SMTP_*` values. Gmail needs an App Password. Check whether the daily limit was reached. |
| Page looks stale on `localhost` | An old Service Worker may be caching responses. Unregister it in DevTools (**Application → Service Workers**). |
| Production start fails with a security error | Set `JWT_SECRET` to a random value of at least 32 characters and `SUPERADMIN_PASSWORD` to at least 12 characters (not `superadmin`) in `rsp-dashboard/.env`. |
| Login works but you are sent straight back to the login page | `COOKIE_SECURE=true` on a plain-HTTP install. Set it to `false` unless the dashboard is served over HTTPS. |
| Evaluators get "Only administrators can do this." | That action is admin-only. Ask an admin, or change the user's role. |

<p align="right"><a href="#top">⬆ back to top</a></p>

---

## 🤝 Contributing

1. Create a branch from `main`, e.g. `feature/vacancy-filter` or `fix/notice-filename`.
2. Keep changes focused, and match the existing code style (CommonJS, Express controllers and routes, Handlebars partials).
3. Run the [Testing](#-testing) checks.
4. Update this README and the changelogs whenever behavior, configuration or dependencies change. That includes bumping the version badges.
5. Write a clear commit message: a short summary line, then what changed and why.
6. Never commit `.env` files, generated notices, backups or real applicant data.
7. Keep local tooling out of the repo: `.claude/` (local Claude settings), `CLAUDE.md` (personal Claude instructions) and `commit-msg.txt` (draft commit message) are listed in `.gitignore`.

---

## 📝 Changelog

Recent highlights:

- 🛡️ **Security, UI and usability pass**
  - Production refuses weak secrets; sessions last 12 hours and pick up role changes immediately.
  - Admin-only and Step 2 rules are enforced on the API.
  - Applicant data is escaped across the dashboard, notice file names are sanitized, and CSV backups are safe to open in Excel.
  - Toasts replace browser alerts, buttons show loading states, and modals, menus, search boxes and filters are labelled for screen readers.
  - The portal validates every application on the server, always generates the tracking code itself, enables a strict CSP, works on phones, saves a draft while applicants type, and shows inline errors instead of pop-ups.
- 🌐 **Online portal, local dashboard**
  - Cloudflare Tunnel deployment guide and a least-privilege portal DB user.
  - Firewall script that keeps the dashboard LAN-only.
  - Configurable `HOST` binding.
  - `helmet`, proxy-aware rate limiting and a 1 MB body limit on the portal.
- 🔐 **Security hardening**
  - scrypt password hashing and required production secrets.
  - helmet headers and rate limiting.
  - Path-traversal protection and safer document conversion.
- ⚡ **Performance**
  - Removed N+1 queries, batched inserts and ran queries in parallel.
  - Cached DOCX templates and added indexes automatically.
- 📉 **Smaller dashboard page**: the `/dashboard` HTML dropped from about 2.6 MB to about 240 KB.
- 📄 **Documents**: generated notice filenames now include the applicant's name, position code, increment and vacancy number.

For the full release history, see [CHANGELOG.md](CHANGELOG.md) and [rsp-dashboard/CHANGELOG.md](rsp-dashboard/CHANGELOG.md).

---

## ⚖️ License

Released under the **ISC** license, as declared in each application's `package.json`.

The official templates, logos and seals in this repository belong to the **Department of Education**. They are included for use by the Division of Iligan City only.

---

## 👤 Author

**Jevoel16** · [GitHub](https://github.com/Jevoel16)<br/>
Personnel Section, Recruitment, Selection and Placement (RSP), DepEd Division of Iligan City

<div align="center">
<sub>Built for the DepEd Division of Iligan City · Personnel Section, RSP</sub>
</div>

<p align="right"><a href="#top">⬆ back to top</a></p>
