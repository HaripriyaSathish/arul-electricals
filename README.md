# ARUL ELECTRICAL — Website + Admin Panel

React + Vite frontend · Core PHP API · MySQL locally / PostgreSQL (Neon) on Render. Every section, image and label on the website is stored in the database and editable from the admin panel.

## Run locally (two terminals, from this `arul_electricals` folder)

**0. First time only** — copy `backend/.env.example` to `backend/.env` and fill in your MySQL password and an `APP_KEY`.

**1. Database (first time / after pulling changes)** — creates missing tables, adds new fields, imports images into the media library. Safe to re-run; never overwrites content edited in the admin.

```
php database/setup.php
```

**2. Backend API** (keep running)

```
php -d extension=gd -S localhost:8000 -t backend/uploads backend/index.php
```

> `-d extension=gd` turns on automatic image compression for uploads (or enable `extension=gd` in `C:\xampp\php\php.ini`).
> Use exactly this command. Running `php -S localhost:8000` inside the `backend` folder exposes `backend/.env` (database password) to the browser.

**3. Frontend** (keep running)

```
cd frontend
npm install
npm run dev
```

- Website: http://localhost:5173
- Admin panel: http://localhost:5173/admin — username `admin`, password `admin123` (change it in Admin → My Account)

## Image performance

All images are served as compressed WebP (max 1920px wide). New uploads are compressed automatically when GD is on. To compress existing images again:

```
php -d extension=gd database/optimize_images.php
```

## Configuration

| File | What |
|---|---|
| `backend/.env` | Local only, never committed. MySQL connection, allowed frontend URLs (CORS), upload size, `APP_KEY` (encrypts the SMTP password). Template: `backend/.env.example` |
| `DATABASE_URL` (env var) | When set, PostgreSQL/Neon is used instead of MySQL (Render) |
| `frontend/.env` | `VITE_API_URL` for local dev (`http://localhost:8000`) |
| `frontend/.env.production` | Empty `VITE_API_URL` → production calls the API on the same domain |

## Admin panel

- **Dashboard** — enquiry chart, setup checklist, content overview
- **Enquiries** — status (New / Seen / Replied / Closed), notes, call/WhatsApp/email buttons, CSV export
- **Media Library** — all website images; upload, rename, alt text, folders, “where used”
- **Website content** — one page per homepage section (hero slider, capabilities, about, services, panel feature, why us, projects, workflow, testimonials, CTA, contact)
- **Site Settings** — logo, favicon, contact details, Call/WhatsApp buttons & message, Google Map, footer, SEO, **Email & SMTP** (enquiry notifications + test email)
- **Footer & Legal Pages** — Privacy Policy, Terms of Service, Statutory Approvals pop-ups, developer credit

## Deploy on Render (free) with Neon PostgreSQL

One Render **web service** runs everything: the website, the admin panel and the PHP API (see `Dockerfile` and `deploy/`).
Images are stored inside the Neon database (`media_files` table), because Render's free plan erases the server disk on every deploy.

### 1. Copy local data to Neon (whenever you want Neon to match your local MySQL)

In Git Bash, from this folder (paste your own Neon connection string):

```
DATABASE_URL='postgresql://USER:PASSWORD@HOST/neondb?sslmode=require' php -d extension=pdo_pgsql database/migrate_to_postgres.php
```

It creates the tables and copies all content, enquiries, admin users and images.
If Neon already has content it stops; add `--force` to replace it (this overwrites edits made on the live site).

### 2. Create the web service on Render

1. https://dashboard.render.com → **New** → **Web Service** → connect GitHub → pick this repository.
2. **Language / Runtime:** Docker (detected from the `Dockerfile`). **Branch:** `main`. **Root directory:** leave empty.
3. **Region:** Ohio (US East) — closest to the Neon database. **Instance type:** Free.
4. **Environment variables:**
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | your Neon connection string |
   | `APP_KEY` | the same `APP_KEY` as in your local `backend/.env` |
5. **Advanced → Health check path:** `/api/health`
6. **Create Web Service.** The first build takes ~5–8 minutes. Your site is then at `https://<service-name>.onrender.com` and the admin at `/admin`.

Every `git push` to `main` redeploys automatically. On the free plan the service sleeps after 15 minutes without visitors, so the first visit after that takes ~50 seconds.

### Other Apache hosting (cPanel / XAMPP)

- `backend/.htaccess` routes requests to `index.php` and blocks `.env` and source folders.
- Build the frontend with `npm run build` and upload `frontend/dist`. Configure the web server to serve `index.html` for unknown paths (so `/admin` works).
