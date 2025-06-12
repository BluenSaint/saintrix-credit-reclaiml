-- Create admin_logs table
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  timestamp TIMESTAMPTZ DEFAULT now(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS admin_logs_admin_id_idx ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS admin_logs_timestamp_idx ON admin_logs(timestamp);
CREATE INDEX IF NOT EXISTS admin_logs_client_id_idx ON admin_logs(client_id);

-- Enable RLS
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view all logs"
  ON admin_logs FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM admins
    )
  );

CREATE POLICY "Admins can insert logs"
  ON admin_logs FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM admins
    )
  );

-- Create function to automatically update timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.timestamp = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER update_admin_logs_timestamp
  BEFORE UPDATE ON admin_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp(); 