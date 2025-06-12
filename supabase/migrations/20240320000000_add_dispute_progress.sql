-- Create dispute_progress table
CREATE TABLE IF NOT EXISTS dispute_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    dispute_id UUID REFERENCES disputes(id) ON DELETE CASCADE,
    milestone VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create client_feedback table
CREATE TABLE IF NOT EXISTS client_feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_chat_history table
CREATE TABLE IF NOT EXISTS ai_chat_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE dispute_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;

-- Dispute progress policies
CREATE POLICY "Users can view their own dispute progress"
    ON dispute_progress FOR SELECT
    USING (client_id IN (
        SELECT id FROM clients WHERE user_id = auth.uid()
    ));

CREATE POLICY "Admins can view all dispute progress"
    ON dispute_progress FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM admins WHERE id = auth.uid()
    ));

-- Client feedback policies
CREATE POLICY "Users can insert their own feedback"
    ON client_feedback FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own feedback"
    ON client_feedback FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all feedback"
    ON client_feedback FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM admins WHERE id = auth.uid()
    ));

-- AI chat history policies
CREATE POLICY "Users can insert their own chat history"
    ON ai_chat_history FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own chat history"
    ON ai_chat_history FOR SELECT
    USING (user_id = auth.uid());

-- Create function to update dispute progress
CREATE OR REPLACE FUNCTION update_dispute_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- When a dispute is created, initialize progress milestones
    IF TG_OP = 'INSERT' THEN
        INSERT INTO dispute_progress (client_id, dispute_id, milestone)
        VALUES 
            (NEW.client_id, NEW.id, 'intake_complete'),
            (NEW.client_id, NEW.id, 'credit_report_synced'),
            (NEW.client_id, NEW.id, 'first_round_letters_sent'),
            (NEW.client_id, NEW.id, 'awaiting_bureau_response'),
            (NEW.client_id, NEW.id, 'repair_complete');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for dispute progress
CREATE TRIGGER dispute_progress_trigger
    AFTER INSERT ON disputes
    FOR EACH ROW
    EXECUTE FUNCTION update_dispute_progress(); 