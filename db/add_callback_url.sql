-- Add callback_url column to requests table for webhook support
-- Run this in Supabase SQL Editor

ALTER TABLE requests
ADD COLUMN IF NOT EXISTS callback_url TEXT;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'requests' AND column_name = 'callback_url';
