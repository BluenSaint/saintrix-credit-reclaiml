-- Create user_sentiment_logs table
CREATE TABLE IF NOT EXISTS user_sentiment_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trigger TEXT NOT NULL,
    sentiment_score INTEGER NOT NULL CHECK (sentiment_score >= 0 AND sentiment_score <= 100),
    confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    keywords TEXT[] NOT NULL DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_flags table
CREATE TABLE IF NOT EXISTS user_flags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    flag_type TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'false_positive')),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_sentiment_logs_user_id ON user_sentiment_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_logs_timestamp ON user_sentiment_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_sentiment_logs_confidence ON user_sentiment_logs(confidence_score);
CREATE INDEX IF NOT EXISTS idx_user_flags_user_id ON user_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_user_flags_status ON user_flags(status);
CREATE INDEX IF NOT EXISTS idx_user_flags_type ON user_flags(flag_type);

-- Enable RLS
ALTER TABLE user_sentiment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_flags ENABLE ROW LEVEL SECURITY;

-- Create policies for sentiment logs
CREATE POLICY "Users can view their own sentiment logs"
    ON user_sentiment_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sentiment logs"
    ON user_sentiment_logs FOR SELECT
    USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Create policies for user flags
CREATE POLICY "Users can view their own flags"
    ON user_flags FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all flags"
    ON user_flags FOR SELECT
    USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

CREATE POLICY "Admins can manage flags"
    ON user_flags FOR ALL
    USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Create function to check and flag users based on sentiment
CREATE OR REPLACE FUNCTION check_user_sentiment()
RETURNS TRIGGER AS $$
DECLARE
    total_score INTEGER;
    weighted_score INTEGER;
    total_confidence INTEGER;
BEGIN
    -- Calculate weighted sentiment score for the last 30 days
    SELECT 
        COALESCE(SUM(sentiment_score * (confidence_score::float / 100)), 0),
        COALESCE(SUM(confidence_score::float / 100), 0)
    INTO weighted_score, total_confidence
    FROM user_sentiment_logs
    WHERE user_id = NEW.user_id
    AND timestamp > NOW() - INTERVAL '30 days';

    -- Calculate final score
    total_score := CASE 
        WHEN total_confidence > 0 THEN (weighted_score / total_confidence)::INTEGER
        ELSE 50
    END;

    -- If total score exceeds threshold (70), create or update flag
    IF total_score >= 70 THEN
        INSERT INTO user_flags (user_id, flag_type, reason, metadata)
        VALUES (
            NEW.user_id,
            'at_risk',
            'High sentiment score detected: ' || total_score,
            jsonb_build_object(
                'sentiment_score', total_score,
                'confidence', total_confidence,
                'keywords', NEW.keywords
            )
        )
        ON CONFLICT (user_id, flag_type) 
        WHERE status = 'active'
        DO UPDATE SET
            reason = 'High sentiment score detected: ' || total_score,
            metadata = jsonb_build_object(
                'sentiment_score', total_score,
                'confidence', total_confidence,
                'keywords', NEW.keywords
            ),
            created_at = NOW(),
            resolved_at = NULL,
            status = 'active';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check sentiment after each log entry
CREATE TRIGGER check_sentiment_trigger
    AFTER INSERT ON user_sentiment_logs
    FOR EACH ROW
    EXECUTE FUNCTION check_user_sentiment(); 