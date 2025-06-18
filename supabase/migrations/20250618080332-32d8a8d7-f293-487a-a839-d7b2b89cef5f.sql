
-- Créer les buckets de stockage requis
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('databases', 'databases', true, 52428800, ARRAY['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/octet-stream']),
  ('templates', 'templates', true, 52428800, ARRAY['text/html', 'text/plain', 'application/octet-stream']),
  ('blacklists', 'blacklists', true, 10485760, ARRAY['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/octet-stream'])
ON CONFLICT (id) DO NOTHING;

-- Créer les politiques RLS pour permettre l'accès aux fichiers
CREATE POLICY "Allow public access to databases bucket" ON storage.objects
  FOR ALL USING (bucket_id = 'databases');

CREATE POLICY "Allow public access to templates bucket" ON storage.objects
  FOR ALL USING (bucket_id = 'templates');

CREATE POLICY "Allow public access to blacklists bucket" ON storage.objects
  FOR ALL USING (bucket_id = 'blacklists');
