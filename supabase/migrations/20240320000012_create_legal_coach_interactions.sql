-- Create legal_coach_interactions table
CREATE TABLE IF NOT EXISTS legal_coach_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT,
    helpful BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_legal_coach_interactions_user_id ON legal_coach_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_coach_interactions_category ON legal_coach_interactions(category);
CREATE INDEX IF NOT EXISTS idx_legal_coach_interactions_created_at ON legal_coach_interactions(created_at);

-- Enable RLS
ALTER TABLE legal_coach_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own interactions"
    ON legal_coach_interactions FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own interactions"
    ON legal_coach_interactions FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own interactions"
    ON legal_coach_interactions FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all interactions"
    ON legal_coach_interactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admins WHERE id = auth.uid()
        )
    );

-- Create function to anonymize interactions for analytics
CREATE OR REPLACE FUNCTION anonymize_legal_coach_interactions()
RETURNS TABLE (
    category TEXT,
    question_length INTEGER,
    answer_length INTEGER,
    helpful BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lci.category,
        length(lci.question) as question_length,
        length(lci.answer) as answer_length,
        lci.helpful,
        lci.created_at
    FROM legal_coach_interactions lci;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 