-- Create dispute_followups table
CREATE TABLE IF NOT EXISTS dispute_followups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dispute_id UUID REFERENCES disputes(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('email', 'letter', 'phone', 'fax')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_date TIMESTAMP WITH TIME ZONE,
    recipient TEXT NOT NULL,
    content TEXT,
    response_received BOOLEAN DEFAULT FALSE,
    response_date TIMESTAMP WITH TIME ZONE,
    response_content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_dispute_followups_dispute_id ON dispute_followups(dispute_id);
CREATE INDEX IF NOT EXISTS idx_dispute_followups_status ON dispute_followups(status);
CREATE INDEX IF NOT EXISTS idx_dispute_followups_scheduled_date ON dispute_followups(scheduled_date);

-- Enable RLS
ALTER TABLE dispute_followups ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own dispute followups"
    ON dispute_followups FOR SELECT
    USING (
        dispute_id IN (
            SELECT id FROM disputes WHERE client_id IN (
                SELECT id FROM clients WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Admins can view all dispute followups"
    ON dispute_followups FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admins WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can insert dispute followups"
    ON dispute_followups FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admins WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can update dispute followups"
    ON dispute_followups FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM admins WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can delete dispute followups"
    ON dispute_followups FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM admins WHERE id = auth.uid()
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_dispute_followups_updated_at
    BEFORE UPDATE ON dispute_followups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 