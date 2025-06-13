import { supabase } from '@/lib/supabase'
import { ExportClient } from './export-client'
import type { Database } from '@/types/supabase'

type ExportRequest = {
  admin_id: string
  user_id: string
  format: 'pdf' | 'csv'
}

export async function handleExport(request: ExportRequest) {
  try {
    // Get session and verify admin role
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      throw new Error('Unauthorized')
    }

    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (adminError || adminData?.role !== 'admin') {
      throw new Error('Unauthorized - Admin access required')
    }

    // Validate request body
    const { admin_id, user_id, format } = request
    
    if (!admin_id || !user_id || !format) {
      throw new Error('Missing required fields')
    }

    // Fetch client data
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user_id)
      .single()

    if (clientError || !client) {
      throw new Error('Client not found')
    }

    // Fetch related data
    const { data: disputes } = await supabase
      .from('disputes')
      .select('*')
      .eq('client_id', client.id)

    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .eq('client_id', client.id)

    // Initialize export client
    const exportClient = new ExportClient(client, disputes || [], documents || [])

    // Generate and save document
    let content: Uint8Array | string
    if (format === 'pdf') {
      content = await exportClient.generatePDF()
    } else {
      content = exportClient.generateCSV()
    }

    await exportClient.saveDocument(format, content)

    // Log the export action
    const { error: logError } = await supabase
      .from('admin_logs')
      .insert({
        admin_id: session.user.id,
        action: `export_${format}`,
        target_user_id: user_id,
        timestamp: new Date().toISOString(),
        file_type: format,
        file_name: `${client.id}/${format}-${Date.now()}.${format}`
      })

    if (logError) {
      console.error('Failed to log export action:', logError)
    }

    return {
      success: true,
      message: `${format.toUpperCase()} export completed successfully`
    }

  } catch (error) {
    console.error('Export error:', error)
    throw error
  }
} 