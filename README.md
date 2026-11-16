# ARUL ELECTRICAL — Website + Admin Panel

React + Vite frontend · Core PHP API · MySQL. Every section, image and label on the website is stored in the database and editable from the admin panel.

## Run locally (two terminals, from this `arul_electricals` folder)

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
| `backend/.env` | MySQL connection, allowed frontend URLs (CORS), upload size, `APP_KEY` (encrypts the SMTP password) |
| `frontend/.env` | `VITE_API_URL` — where the PHP API runs |

## Admin panel

- **Dashboard** — enquiry chart, setup checklist, content overview
- **Enquiries** — status (New / Seen / Replied / Closed), notes, call/WhatsApp/email buttons, CSV export
- **Media Library** — all website images; upload, rename, alt text, folders, “where used”
- **Website content** — one page per homepage section (hero slider, capabilities, about, services, panel feature, why us, projects, workflow, testimonials, CTA, contact)
- **Site Settings** — logo, favicon, contact details, Call/WhatsApp buttons & message, Google Map, footer, SEO, **Email & SMTP** (enquiry notifications + test email)
- **Footer & Legal Pages** — Privacy Policy, Terms of Service, Statutory Approvals pop-ups, developer credit

## Deploying on Apache (XAMPP / cPanel)

- `backend/.htaccess` routes requests to `index.php` and blocks `.env` and source folders.
- Build the frontend with `npm run build` and upload `frontend/dist`. Configure the web server to serve `index.html` for unknown paths (so `/admin` works).
- Set `VITE_API_URL` to the live API URL before building, and add the live site URL to `CORS_ORIGINS` in `backend/.env`.
