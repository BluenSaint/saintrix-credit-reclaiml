-- Create a function to call the daily digest endpoint
CREATE OR REPLACE FUNCTION trigger_daily_digest()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Call the daily digest function
  PERFORM
    net.http_post(
      url := current_setting('app.settings.daily_digest_url'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      )
    );
END;
$$;

-- Create a cron job to run daily at 8 AM UTC
SELECT cron.schedule(
  'daily-digest',  -- job name
  '0 8 * * *',    -- cron schedule (8 AM UTC)
  $$SELECT trigger_daily_digest()$$
);

-- Add settings for the daily digest URL
ALTER DATABASE postgres SET "app.settings.daily_digest_url" = 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/daily-digest'; 