CREATE TABLE IF NOT EXISTS sentiment_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES clients(user_id),
  timestamp timestamptz DEFAULT now(),
  sentiment text,
  message text
);
