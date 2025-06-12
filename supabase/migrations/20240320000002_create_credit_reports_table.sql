-- Create credit_reports table
CREATE TABLE IF NOT EXISTS credit_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK (source IN ('karma', 'experian')),
    score INTEGER NOT NULL,
    items JSONB NOT NULL,
    sync_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS credit_reports_user_id_idx ON credit_reports(user_id);

-- Create RLS policies
ALTER TABLE credit_reports ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own credit reports
CREATE POLICY "Users can view their own credit reports"
    ON credit_reports FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to insert their own credit reports
CREATE POLICY "Users can insert their own credit reports"
    ON credit_reports FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own credit reports
CREATE POLICY "Users can update their own credit reports"
    ON credit_reports FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own credit reports
CREATE POLICY "Users can delete their own credit reports"
    ON credit_reports FOR DELETE
    USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_credit_reports_updated_at
    BEFORE UPDATE ON credit_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 