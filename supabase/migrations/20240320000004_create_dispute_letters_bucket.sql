-- Create storage bucket for dispute letters
INSERT INTO storage.buckets (id, name, public)
VALUES ('dispute_letters', 'dispute_letters', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the bucket
CREATE POLICY "Users can upload their own dispute letters"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'dispute_letters' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own dispute letters"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'dispute_letters' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own dispute letters"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'dispute_letters' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own dispute letters"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'dispute_letters' AND
  auth.uid()::text = (storage.foldername(name))[1]
); 