
-- Créer le bucket requests s'il n'existe pas déjà
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('requests', 'requests', true, 52428800, ARRAY['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/octet-stream'])
ON CONFLICT (id) DO NOTHING;

-- Créer les politiques RLS pour permettre l'accès aux fichiers dans le bucket requests
CREATE POLICY "Allow public access to requests bucket" ON storage.objects
  FOR ALL USING (bucket_id = 'requests');
