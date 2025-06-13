import { supabase } from './supabase';
import type { Database } from '../types/supabase';

export async function exportClientData(clientId: string) {
  try {
    // Fetch client data
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientError) throw clientError;

    // Fetch credit reports
    const { data: creditReports, error: reportsError } = await supabase
      .from('credit_reports')
      .select('*')
      .eq('client_id', clientId);

    if (reportsError) throw reportsError;

    // Combine data
    const exportData = {
      client,
      creditReports,
      exportDate: new Date().toISOString(),
    };

    // Convert to JSON string
    const jsonString = JSON.stringify(exportData, null, 2);

    // Create blob and download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `client-export-${clientId}-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, error };
  }
} 