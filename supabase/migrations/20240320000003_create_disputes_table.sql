-- Create disputes table
CREATE TABLE IF NOT EXISTS disputes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bureau TEXT NOT NULL CHECK (bureau IN ('Experian', 'TransUnion', 'Equifax')),
    item_type TEXT NOT NULL,
    opened_date DATE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
    round INTEGER NOT NULL DEFAULT 1,
    letter_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS disputes_user_id_idx ON disputes(user_id);

-- Create RLS policies
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own disputes
CREATE POLICY "Users can view their own disputes"
    ON disputes FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to insert their own disputes
CREATE POLICY "Users can insert their own disputes"
    ON disputes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own disputes
CREATE POLICY "Users can update their own disputes"
    ON disputes FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own disputes
CREATE POLICY "Users can delete their own disputes"
    ON disputes FOR DELETE
    USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_disputes_updated_at
    BEFORE UPDATE ON disputes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 