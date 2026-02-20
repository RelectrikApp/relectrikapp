# Relectrikapp

AI-Powered Business Operating System (Beta v1.0) — Right Electrik.

## Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** Supabase (PostgreSQL) — set `DATABASE_URL` in `.env`
- **Auth:** NextAuth.js (Credentials provider)

## Setup

1. **Clone and install**
   ```bash
   cd relectrikapp
   npm install
   ```

2. **Environment**
   - Copy `.env.example` to `.env`
   - Set `DATABASE_URL` to your Supabase PostgreSQL connection string
   - Set `NEXTAUTH_SECRET` (e.g. `openssl rand -base64 32`)
   - Set `NEXTAUTH_URL` (e.g. `http://localhost:3000` for dev)

3. **Database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Seed (optional)** — create first admin user
   ```bash
   npx prisma db seed
   ```
   Log in at `/tech/login` with `admin@relectrikapp.com` / `admin123`, then open `/dashboard` to manage users and projects. (Change password after first login.)

5. **Run**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Implemented (Phases 0–2 + Technician auth)

- **Phase 0:** Next.js, TypeScript, Tailwind, Prisma schema (full v1.0), NextAuth, basic shell
- **Phase 1:** User CRUD, roles (ADMIN / TECHNICIAN / CEO), user management dashboard
- **Phase 2:** Project CRUD, status workflow, project list/detail/edit
- **Technician auth:** Login and sign-up screens (Spanish, dark theme, green CTA, Right Electrik logo), technician home placeholder

## Routes

| Route | Description |
|-------|-------------|
| `/` | Home (links to tech login and dashboard) |
| `/tech/login` | Technician login |
| `/tech/register` | Technician sign-up |
| `/tech` | Technician area (after login) |
| `/dashboard` | Admin/CEO dashboard (Inicio, Usuarios, Proyectos) |
| `/dashboard/users` | User list + new/edit |
| `/dashboard/projects` | Project list + new/detail/edit |

## Logo

Place your Right Electrik logo as `public/logo.svg` or replace the provided SVG. The app uses it on technician login and sign-up screens.

## Next steps (from PRD)

- Phase 2.5: AI proof-of-concept
- Phase 3: Assignment notifications
- Phase 4–7: GPS, work sessions, materials, invoicing
- Phase 8: AI Assistant core
- Phase 9: CEO/Admin AI-first dashboard
- Phase 10 (full): Technician mobile — punch in/out, GPS, materials, job status
