-- ============================================================
-- Storage RLS Policies for payment-receipts bucket
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Make sure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing policies for this bucket to avoid conflicts
DROP POLICY IF EXISTS "payment-receipts public upload" ON storage.objects;
DROP POLICY IF EXISTS "payment-receipts public download" ON storage.objects;
DROP POLICY IF EXISTS "payment-receipts public delete" ON storage.objects;

-- 3. Allow any user (including anon) to upload files into payment-receipts
CREATE POLICY "payment-receipts public upload"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'payment-receipts');

-- 4. Allow any user to download/read files from payment-receipts
CREATE POLICY "payment-receipts public download"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'payment-receipts');

-- 5. Allow any user to delete files from payment-receipts (optional, for cleanup)
CREATE POLICY "payment-receipts public delete"
ON storage.objects
FOR DELETE
TO anon, authenticated
USING (bucket_id = 'payment-receipts');

-- 6. Update the bucket to be public and verify it exists
-- (This may already be done from the dashboard)
UPDATE storage.buckets
SET public = true
WHERE id = 'payment-receipts';

-- Verify
SELECT id, name, public FROM storage.buckets WHERE id = 'payment-receipts';
SELECT policyname, roles, cmd FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
