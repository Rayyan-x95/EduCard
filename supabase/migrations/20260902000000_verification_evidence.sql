-- ============================================================================
-- Migration: 20260902000000_verification_evidence.sql
-- Description: Secure private bucket for verification evidence documents.
--
-- SECURITY MODEL:
--   * Bucket is PRIVATE (no public read).
--   * Owner may upload/delete only inside their own uid-prefixed folder.
--   * READ access is restricted to:
--       - the uploading owner (their own folder), or
--       - moderators/admins reviewing the request.
--   * Anonymous users have zero access.
--   * This differs from `attachments`, where any authenticated user can read;
--     evidence documents are PII-sensitive so reviewer-only reads apply.
--
-- Fixes: verification_requests.evidence_path was previously unusable because
--        no safe storage target existed.
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'verification',
    'verification',
    FALSE,
    10485760, -- 10 MB cap per document
    ARRAY[
        'image/png', 'image/jpeg', 'image/webp',
        'application/pdf'
    ]
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Owner uploads into their own uid folder.
DROP POLICY IF EXISTS "Users upload own verification evidence" ON storage.objects;
CREATE POLICY "Users upload own verification evidence"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'verification'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
);

DROP POLICY IF EXISTS "Users delete own verification evidence" ON storage.objects;
CREATE POLICY "Users delete own verification evidence"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'verification'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Reviewer-or-owner reads. Moderators need signed URLs to inspect documents.
-- public.is_moderator() is SECURITY DEFINER STABLE and already exists.
DROP POLICY IF EXISTS "Owner or moderator reads verification evidence" ON storage.objects;
CREATE POLICY "Owner or moderator reads verification evidence"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'verification'
    AND (
        (storage.foldername(name))[1] = (select auth.uid())::text
        OR public.is_moderator()
    )
);

COMMENT ON POLICY "Owner or moderator reads verification evidence" ON storage.objects IS
'Verification documents are PII. Only the uploader and staff reviewers may generate signed URLs.';
