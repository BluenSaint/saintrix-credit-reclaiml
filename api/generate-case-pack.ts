import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../src/lib/supabase';
import { CasePackGenerator } from '../src/services/case-pack';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    // Get session and verify admin role
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Fetch client data
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (clientError || !client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Fetch related data
    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .eq('client_id', client.id);

    const { data: disputes } = await supabase
      .from('disputes')
      .select('*')
      .eq('client_id', client.id);

    const { data: creditReports } = await supabase
      .from('credit_reports')
      .select('*')
      .eq('user_id', userId);

    // Generate case pack
    const casePackGenerator = new CasePackGenerator(
      client,
      documents || [],
      disputes || [],
      creditReports || []
    );

    const casePackBlob = await casePackGenerator.generateCasePack();

    // Log the export action
    await supabase.from('admin_logs').insert({
      admin_id: session.user.id,
      action: 'export_case_pack',
      target_user_id: userId,
      timestamp: new Date().toISOString(),
      details: {
        client_id: client.id,
        documents_count: documents?.length || 0,
        disputes_count: disputes?.length || 0,
        credit_reports_count: creditReports?.length || 0
      }
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=case-pack-${client.id}.zip`);

    // Send the ZIP file
    res.status(200).send(Buffer.from(await casePackBlob.arrayBuffer()));
  } catch (error: any) {
    console.error('Case pack generation error:', error);
    res.status(500).json({ error: error.message });
  }
} 