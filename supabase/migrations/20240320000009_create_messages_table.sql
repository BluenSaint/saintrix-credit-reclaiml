-- Create messages table for client-admin communication
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL, -- references clients(id) or admins(id)
    sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'admin')),
    recipient_id UUID NOT NULL, -- references clients(id) or admins(id)
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('client', 'admin')),
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    thread_id UUID,
    attachment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Clients can view their own messages"
    ON messages FOR SELECT
    USING (
        (sender_type = 'client' AND sender_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))
        OR (recipient_type = 'client' AND recipient_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))
    );

CREATE POLICY "Admins can view all messages"
    ON messages FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
    );

CREATE POLICY "Clients can insert their own messages"
    ON messages FOR INSERT
    WITH CHECK (
        sender_type = 'client' AND sender_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can insert messages"
    ON messages FOR INSERT
    WITH CHECK (
        sender_type = 'admin' AND EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
    ); 