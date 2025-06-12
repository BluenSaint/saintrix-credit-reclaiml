-- Create testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  message TEXT NOT NULL,
  score_improvement INTEGER,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Testimonials are viewable by everyone"
  ON testimonials FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own testimonials"
  ON testimonials FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update their own testimonials"
  ON testimonials FOR UPDATE
  USING (auth.uid() = client_id);

CREATE POLICY "Admins can manage all testimonials"
  ON testimonials FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM admin_users
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_testimonials_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER testimonials_timestamp_trigger
  BEFORE UPDATE ON testimonials
  FOR EACH ROW
  EXECUTE FUNCTION update_testimonials_timestamp();

-- Create index for featured testimonials
CREATE INDEX IF NOT EXISTS idx_testimonials_featured
  ON testimonials(is_featured)
  WHERE is_featured = true; 