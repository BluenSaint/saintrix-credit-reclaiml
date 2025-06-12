-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    referral_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    reward_type TEXT CHECK (reward_type IN ('free_month', 'discount')),
    reward_status TEXT DEFAULT 'pending' CHECK (reward_status IN ('pending', 'issued', 'expired'))
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);

-- Enable RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own referrals"
    ON referrals FOR SELECT
    USING (
        referrer_id IN (
            SELECT id FROM clients WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own referrals"
    ON referrals FOR INSERT
    WITH CHECK (
        referrer_id IN (
            SELECT id FROM clients WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all referrals"
    ON referrals FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admins WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can update referral status"
    ON referrals FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM admins WHERE id = auth.uid()
        )
    );

-- Create function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
BEGIN
    -- Generate a random 6-character alphanumeric code
    code := upper(substring(md5(random()::text) from 1 for 6));
    
    -- Check if code already exists
    WHILE EXISTS (SELECT 1 FROM referrals WHERE referral_code = code) LOOP
        code := upper(substring(md5(random()::text) from 1 for 6));
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql; 