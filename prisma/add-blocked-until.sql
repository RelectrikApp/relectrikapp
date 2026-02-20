-- Add blockedUntil column for technician block-until-6am logic
-- Run in Supabase SQL Editor if you created tables manually

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "blockedUntil" TIMESTAMP(3) WITH TIME ZONE;
