-- Run in Supabase SQL Editor.
-- Email verification and password reset: adds User.emailVerifiedAt and AuthToken table.
-- All users (new and existing) must verify email to sign in; existing users can use "Resend verification email" on the login page.

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(3) WITH TIME ZONE;

CREATE TABLE IF NOT EXISTS "AuthToken" (
  "id"        TEXT NOT NULL,
  "email"     TEXT NOT NULL,
  "token"     TEXT NOT NULL,
  "type"      TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL,
  "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AuthToken_token_key" ON "AuthToken"("token");
CREATE INDEX IF NOT EXISTS "AuthToken_token_type_idx" ON "AuthToken"("token", "type");
CREATE INDEX IF NOT EXISTS "AuthToken_email_type_idx" ON "AuthToken"("email", "type");
