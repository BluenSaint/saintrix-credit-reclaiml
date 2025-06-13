import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { AdminGuard } from '@/components/guards/AdminGuard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Download, FileText, CreditCard, User, Mail, Phone, Calendar } from 'lucide-react'
import { handleExport } from '@/services/export'

interface ClientDetails {
  id: string
  full_name: string
  email: string
  phone: string
  dob: string
  address: string
  ssn_last4: string
  created_at: string
  documents: Document[]
  credit_reports: CreditReport[]
  disputes: Dispute[]
}

interface Document {
  id: string
  type: string
  file_url: string
  created_at: string
}

interface CreditReport {
  id: string
  bureau: string
  score: number
  synced_at: string
}

interface Dispute {
  id: string
  bureau: string
  reason: string
  status: string
  created_at: string
}

export default function AdminClientDetails() {
  const { id } = useParams<{ id: string }>()
  const [client, setClient] = useState<ClientDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (id) {
      fetchClientDetails(id)
    }
  }, [id])

  const fetchClientDetails = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          id,
          full_name,
          dob,
          address,
          ssn_last4,
          created_at,
          user:user_id (
            email,
            phone
          ),
          documents (
            id,
            type,
            file_url,
            created_at
          ),
          credit_reports (
            id,
            bureau,
            score,
            synced_at
          ),
          disputes (
            id,
            bureau,
            reason,
            status,
            created_at
          )
        `)
        .eq('id', clientId)
        .single()

      if (error) throw error

      setClient({
        ...data,
        email: data.user?.email || 'No email',
        phone: data.user?.phone || 'No phone',
        documents: data.documents || [],
        credit_reports: data.credit_reports || [],
        disputes: data.disputes || []
      })
    } catch (error) {
      console.error('Error fetching client details:', error)
      toast.error('Failed to load client details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportData = async (format: 'pdf' | 'csv') => {
    try {
      if (!client) return

      const result = await handleExport({
        admin_id: 'current', // This will be set by the service
        user_id: client.id,
        format
      })

      if (result.success) {
        toast.success(result.message)
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export data')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Client not found</h2>
          <Button
            className="mt-4"
            onClick={() => navigate('/admin/clients')}
          >
            Back to Clients
          </Button>
        </div>
      </div>
    )
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => navigate('/admin/clients')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clients
            </Button>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{client.full_name}</h1>
                <p className="text-gray-600 mt-2">Client Details</p>
              </div>
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={() => handleExportData('pdf')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExportData('csv')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </div>

          {/* Client Info */}
          <Card className="p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{client.full_name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{client.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium">{client.phone}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-600">DOB:</span>
                  <span className="font-medium">{client.dob}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Address:</span>
                  <span className="font-medium">{client.address}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">SSN:</span>
                  <span className="font-medium">••••{client.ssn_last4}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Documents */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Documents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {client.documents.map((doc) => (
                <Card key={doc.id} className="p-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">{doc.type}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Credit Reports */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Credit Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {client.credit_reports.map((report) => (
                <Card key={report.id} className="p-4">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">{report.bureau}</p>
                      <p className="text-sm text-gray-500">
                        Score: {report.score}
                      </p>
                      <p className="text-sm text-gray-500">
                        Synced: {new Date(report.synced_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Disputes */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Disputes</h2>
            <div className="space-y-4">
              {client.disputes.map((dispute) => (
                <Card key={dispute.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{dispute.bureau}</p>
                      <p className="text-gray-600">{dispute.reason}</p>
                      <p className="text-sm text-gray-500">
                        Created: {new Date(dispute.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-sm ${
                      dispute.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      dispute.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {dispute.status}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminGuard>
  )
} 