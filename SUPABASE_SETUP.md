# Supabase setup for Relectrikapp

Use **`.env.local`** for all secrets so they are not committed to GitHub (`.env.local` is in `.gitignore`).

---

## Step 1: Get your database connection string

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) and select your project.
2. Go to **Project Settings** (gear icon in the sidebar) → **Database**.
3. Scroll to **Connection string**.
4. Choose **URI** and copy the string. It looks like:
   ```txt
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
   ```
5. **Replace `[YOUR-PASSWORD]`** with your actual database password.
   - If you don’t remember it: same page → **Database password** → **Reset database password**. Use the new password in the URI.

---

## Step 2: Create `.env.local`

1. In the project root (`relectrikapp`), copy the example file:
   - Copy **`.env.local.example`** to **`.env.local`**  
   (or create a new file named **`.env.local`**).
2. Edit **`.env.local`** and paste your real values:

```env
# Database – paste the URI from Step 1 (with password replaced)
DATABASE_URL="postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-xx-x.pooler.supabase.com:5432/postgres"

# NextAuth – for local dev
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="paste-a-long-random-string-here"
```

3. **NEXTAUTH_SECRET**: generate a random string, e.g.:
   - PowerShell: `[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])`
   - Or use any long random string (32+ characters).

---

## Step 3: Apply schema and seed (first time)

From the project root:

```bash
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
```

Then:

```bash
npm run dev
```

- Open **http://localhost:3000**
- Log in at **http://localhost:3000/tech/login** with:
  - **Email:** `admin@relectrikapp.com`
  - **Password:** `admin123`  
  (then go to **/dashboard**)

---

## What you have from Supabase

| What you have        | Where it’s used in this project                          |
|----------------------|----------------------------------------------------------|
| **Project ID / Reference** | Inside `DATABASE_URL` (host contains it). No separate env var needed. |
| **Publishable / anon key** | Not used yet. Prisma talks to Postgres directly. If you add Supabase Auth or client later, you’d add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`. |

So for the current setup you only need **DATABASE_URL** (with password), **NEXTAUTH_URL**, and **NEXTAUTH_SECRET** in `.env.local`.
