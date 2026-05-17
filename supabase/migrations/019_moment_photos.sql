-- Add photo_url to kid_point_events for moment photo capture
ALTER TABLE kid_point_events
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Create storage bucket for moment photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('moment-photos', 'moment-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated family members to upload photos
CREATE POLICY IF NOT EXISTS "moment_photos_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'moment-photos');

-- Allow anyone (public bucket) to read photos
CREATE POLICY IF NOT EXISTS "moment_photos_select"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'moment-photos');

-- Allow uploader to delete their own photos
CREATE POLICY IF NOT EXISTS "moment_photos_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'moment-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
