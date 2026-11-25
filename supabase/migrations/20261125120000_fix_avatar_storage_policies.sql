-- B4: any authenticated user could overwrite or delete another user's avatar,
-- because every policy only checked bucket_id. Avatars are stored as
-- `<user_id>/<file>` (src/lib/actions/storageService.ts), so ownership is the
-- first path segment.
--
-- The bucket stays public: public URLs are served without any SELECT policy.
-- The SELECT policy is still needed for `upload(..., { upsert: true })`, but it
-- is narrowed to the owner's folder so the API no longer lists everyone's files.

DROP POLICY IF EXISTS "Auth Insert" ON storage.objects;
DROP POLICY IF EXISTS "Auth Update" ON storage.objects;
DROP POLICY IF EXISTS "Permitir actualización de avatars" ON storage.objects;
DROP POLICY IF EXISTS "Permitir eliminar avatars" ON storage.objects;
DROP POLICY IF EXISTS "Permitir subida de avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

CREATE POLICY "avatars_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid())::text);

CREATE POLICY "avatars_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid())::text);

CREATE POLICY "avatars_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid())::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid())::text);

CREATE POLICY "avatars_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid())::text);
