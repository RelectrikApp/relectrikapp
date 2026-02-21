# Deploy on Vercel – Required environment variables

Set these in **Vercel → Project → Settings → Environment Variables** so login, reset password, and the app work correctly.

## Required (mandatory)

| Variable | Description | Example |
|----------|-------------|--------|
| `DATABASE_URL` | Supabase connection string. **Use the pooler URL** (port **6543** with `?pgbouncer=true`) like in `.env.local`, not the direct port 5432. | `postgresql://postgres.[ref]:[password]@...pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `NEXTAUTH_SECRET` | Secret for NextAuth (session/cookies). Generate with: `openssl rand -base64 32` | Any long random string |
| `NEXTAUTH_URL` | Your app’s public URL | `https://app-m8ms.vercel.app` (or your custom domain) |

Without `NEXTAUTH_SECRET` and `NEXTAUTH_URL` you will see **"Server error"** and login/reset password may fail.

## Required for “Reset password” and email verification

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `RESEND_API_KEY` | API key for Resend (sending emails) | https://resend.com → API Keys → Create |
| `RESEND_FROM` | (Optional) Sender address. If not set, uses `Relectrikapp <onboarding@resend.dev>` (Resend’s test address). For production, use a verified domain, e.g. `Relectrikapp <noreply@tudominio.com>` | Resend dashboard → Domains |

Without `RESEND_API_KEY`, “Send reset link” will show **“Failed to send email”** because the app cannot send the reset email.

**Resend on Vercel:** Paste `RESEND_API_KEY` without quotes. Leave `RESEND_FROM` unset to use `onboarding@resend.dev`. If you see a specific error (e.g. Invalid API key), check https://resend.com/api-keys and ensure the key has Sending permission.

## Optional

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | For the live map at `/dashboard/map` |

After adding or changing variables, **redeploy** the project (Deployments → … → Redeploy).
