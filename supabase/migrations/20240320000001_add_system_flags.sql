-- Create system_flags table
CREATE TABLE IF NOT EXISTS system_flags (
    id INTEGER PRIMARY KEY DEFAULT 1,
    system_paused BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default row
INSERT INTO system_flags (id, system_paused)
VALUES (1, false)
ON CONFLICT (id) DO NOTHING;

-- Add RLS policies
ALTER TABLE system_flags ENABLE ROW LEVEL SECURITY;

-- Only admins can view and modify system flags
CREATE POLICY "Admins can view system flags"
    ON system_flags FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM admins WHERE id = auth.uid()
    ));

CREATE POLICY "Admins can update system flags"
    ON system_flags FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM admins WHERE id = auth.uid()
    ));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_system_flags_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for system_flags
CREATE TRIGGER system_flags_timestamp_trigger
    BEFORE UPDATE ON system_flags
    FOR EACH ROW
    EXECUTE FUNCTION update_system_flags_timestamp(); 