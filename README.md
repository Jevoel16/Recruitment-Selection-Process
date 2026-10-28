<a id="top"></a>

<div align="center">

<img src="rsp-dashboard/public/images/rsp-logo.png" alt="RSP logo" width="120" />

# Recruitment, Selection &amp; Placement System

**A digital RSP workflow for the DepEd Division of Iligan City, from vacancy posting to assignment order.**

<p>
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express_5-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Handlebars-F0772B?style=for-the-badge&logo=handlebarsdotjs&logoColor=white" alt="Handlebars" />
  <img src="https://img.shields.io/badge/Bootstrap_5-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white" alt="Bootstrap" />
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white" alt="Chart.js" />
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT" />
  <img src="https://img.shields.io/badge/Cloudflare_Tunnel-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Cloudflare Tunnel" />
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
- [npm Scripts](#-npm-scripts)
- [Project Structure](#-project-structure)
- [User Accounts and Roles](#-user-accounts-and-roles)
- [Security](#-security)
- [Troubleshooting](#-troubleshooting)
- [Changelog](#-changelog)
- [License](#-license)

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

<div align="center">

**Runtime and server**<br/>
<img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js" />
<img src="https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white" alt="Express" />
<img src="https://img.shields.io/badge/Nodemon-76D04B?style=flat-square&logo=nodemon&logoColor=white" alt="Nodemon" />

**Front end**<br/>
<img src="https://img.shields.io/badge/Handlebars-F0772B?style=flat-square&logo=handlebarsdotjs&logoColor=white" alt="Handlebars" />
<img src="https://img.shields.io/badge/Bootstrap-7952B3?style=flat-square&logo=bootstrap&logoColor=white" alt="Bootstrap" />
<img src="https://img.shields.io/badge/Chart.js-FF6384?style=flat-square&logo=chartdotjs&logoColor=white" alt="Chart.js" />
<img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript" />
<img src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white" alt="CSS3" />

**Data**<br/>
<img src="https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white" alt="MySQL" />
<img src="https://img.shields.io/badge/MariaDB-003545?style=flat-square&logo=mariadb&logoColor=white" alt="MariaDB" />

**Documents and email**<br/>
<img src="https://img.shields.io/badge/Microsoft_Word-2B579A?style=flat-square&logo=microsoftword&logoColor=white" alt="Microsoft Word" />
<img src="https://img.shields.io/badge/LibreOffice-18A303?style=flat-square&logo=libreoffice&logoColor=white" alt="LibreOffice" />
<img src="https://img.shields.io/badge/ExcelJS-217346?style=flat-square&logo=microsoftexcel&logoColor=white" alt="ExcelJS" />
<img src="https://img.shields.io/badge/Nodemailer-22B573?style=flat-square&logo=maildotru&logoColor=white" alt="Nodemailer" />

**Security and deployment**<br/>
<img src="https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white" alt="JWT" />
<img src="https://img.shields.io/badge/Helmet-0F172A?style=flat-square&logo=helm&logoColor=white" alt="Helmet" />
<img src="https://img.shields.io/badge/Cloudflare_Tunnel-F38020?style=flat-square&logo=cloudflare&logoColor=white" alt="Cloudflare Tunnel" />

</div>

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
| `JWT_SECRET` | Secret used to sign login tokens. **Required** when `NODE_ENV=production`. |
| `SUPERADMIN_USERNAME` | Superadmin username (default: `superadmin`). |
| `SUPERADMIN_PASSWORD` | Superadmin password. **Required** when `NODE_ENV=production`. |
| `ADMIN_PASSWORD` | Password given to the `admin` user when it is first created (default: `admin123`). |
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
| `admin` | Admin | `ADMIN_PASSWORD` (default `admin123`) |

| Role | Access |
| --- | --- |
| 🔑 **Superadmin** | Full access, including managing Admin accounts. Superadmin activity is kept out of the audit log. |
| 🧑‍💼 **Admin** | Manages vacancies, applicants, documents and Evaluator accounts. |
| 📝 **Evaluator** | Works on the evaluation steps they have been given. Step 2 (and therefore Step 3) needs the `can_access_step2` permission. |

> [!IMPORTANT]
> Change the default passwords right after the first login. In production, the dashboard won't start until `JWT_SECRET` and `SUPERADMIN_PASSWORD` are set.

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
- Sessions use signed JWTs stored in `sameSite` cookies.

### HTTP hardening
- Both apps send `helmet` security headers, with HSTS turned on in production.
- `/login`, `/step2-login` and the portal's `/api/apply` are rate-limited. Behind the tunnel, limits apply per real applicant IP.
- Request size is limited: 1 MB for the portal and 5 MB for the dashboard (50 MB for the DOCX-to-PDF upload).

### File and process safety
- Backup downloads are protected against path traversal.
- `/generated_notices` is not served publicly.
- Word and LibreOffice are called with file paths as arguments, never through a shell command string.

### Error handling
- The portal never returns raw database errors to applicants.
- Creating an applicant runs in a single transaction.

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
| Production start fails with a security error | Set `JWT_SECRET` and `SUPERADMIN_PASSWORD` in `.env`. |

<p align="right"><a href="#top">⬆ back to top</a></p>

---

## 📝 Changelog

Recent highlights:

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

<div align="center">
<sub>Built for the DepEd Division of Iligan City · Personnel Section, RSP</sub>
</div>

<p align="right"><a href="#top">⬆ back to top</a></p>
