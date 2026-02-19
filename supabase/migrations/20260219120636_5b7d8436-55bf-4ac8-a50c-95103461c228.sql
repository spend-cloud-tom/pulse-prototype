-- Create storage bucket for signal attachments (photos, receipts)
INSERT INTO storage.buckets (id, name, public) VALUES ('signal-attachments', 'signal-attachments', true);

-- Allow anyone to read signal attachments (public bucket)
CREATE POLICY "Signal attachments are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'signal-attachments');

-- Allow authenticated users to upload attachments
CREATE POLICY "Authenticated users can upload signal attachments"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'signal-attachments');

-- Allow authenticated users to update their own attachments
CREATE POLICY "Users can update signal attachments"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'signal-attachments');

-- Allow authenticated users to delete attachments
CREATE POLICY "Users can delete signal attachments"
ON storage.objects
FOR DELETE
USING (bucket_id = 'signal-attachments');