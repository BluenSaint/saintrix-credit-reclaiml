import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SmtpClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get yesterday's date
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStart = new Date(yesterday.setHours(0, 0, 0, 0)).toISOString()
    const yesterdayEnd = new Date(yesterday.setHours(23, 59, 59, 999)).toISOString()

    // Fetch stats
    const [
      { count: newUsers },
      { count: newDisputes },
      { count: missingUploads },
      { data: errors },
      { data: adminEmails }
    ] = await Promise.all([
      supabaseClient
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterdayStart)
        .lte('created_at', yesterdayEnd),
      supabaseClient
        .from('disputes')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterdayStart)
        .lte('created_at', yesterdayEnd),
      supabaseClient
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabaseClient
        .from('admin_logs')
        .select('*')
        .eq('action', 'error')
        .gte('timestamp', yesterdayStart)
        .lte('timestamp', yesterdayEnd),
      supabaseClient
        .from('admins')
        .select('email')
    ])

    // Format email content
    const emailContent = `
      <h1>SAINTRIX Daily Digest</h1>
      <p>Here's your daily summary for ${new Date().toLocaleDateString()}</p>

      <h2>📊 Activity Summary</h2>
      <ul>
        <li>👤 New Users: ${newUsers}</li>
        <li>📄 New Disputes: ${newDisputes}</li>
        <li>⚠️ Missing Uploads: ${missingUploads}</li>
      </ul>

      ${errors && errors.length > 0 ? `
        <h2>⚠️ Errors</h2>
        <ul>
          ${errors.map(error => `
            <li>${error.details?.message || 'Unknown error'} at ${new Date(error.timestamp).toLocaleString()}</li>
          `).join('')}
        </ul>
      ` : ''}

      <p>View full dashboard: ${Deno.env.get('DASHBOARD_URL')}</p>
    `

    // Send email to all admins
    const client = new SmtpClient()
    await client.connectTLS({
      hostname: Deno.env.get('SMTP_HOST') ?? '',
      port: Number(Deno.env.get('SMTP_PORT')),
      username: Deno.env.get('SMTP_USER') ?? '',
      password: Deno.env.get('SMTP_PASS') ?? '',
    })

    for (const admin of adminEmails) {
      await client.send({
        from: Deno.env.get('SMTP_FROM') ?? '',
        to: admin.email,
        subject: 'SAINTRIX Daily Digest',
        content: emailContent,
        html: emailContent,
      })
    }

    await client.close()

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 