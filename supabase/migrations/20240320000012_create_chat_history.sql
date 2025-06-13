-- Create ai_chat_history table
CREATE TABLE IF NOT EXISTS ai_chat_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    sentiment_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON ai_chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON ai_chat_history(created_at);

-- Enable RLS
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own chat history"
    ON ai_chat_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat history"
    ON ai_chat_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat history"
    ON ai_chat_history FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all chat history"
    ON ai_chat_history FOR SELECT
    USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_chat_history_updated_at
    BEFORE UPDATE ON ai_chat_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 