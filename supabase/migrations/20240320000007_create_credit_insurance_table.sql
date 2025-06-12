-- Create credit insurance table
CREATE TABLE IF NOT EXISTS credit_insurance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    policy_number TEXT NOT NULL,
    provider TEXT NOT NULL,
    coverage_amount DECIMAL(10,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    monthly_premium DECIMAL(10,2) NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'current' CHECK (payment_status IN ('current', 'past_due', 'cancelled')),
    last_payment_date DATE,
    next_payment_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_credit_insurance_client_id ON credit_insurance(client_id);
CREATE INDEX IF NOT EXISTS idx_credit_insurance_status ON credit_insurance(status);

-- Enable RLS
ALTER TABLE credit_insurance ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own insurance"
    ON credit_insurance FOR SELECT
    USING (
        client_id IN (
            SELECT id FROM clients WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own insurance"
    ON credit_insurance FOR INSERT
    WITH CHECK (
        client_id IN (
            SELECT id FROM clients WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own insurance"
    ON credit_insurance FOR UPDATE
    USING (
        client_id IN (
            SELECT id FROM clients WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all insurance"
    ON credit_insurance FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admins WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can update all insurance"
    ON credit_insurance FOR UPDATE
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
CREATE TRIGGER update_credit_insurance_updated_at
    BEFORE UPDATE ON credit_insurance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 