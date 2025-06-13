import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { 
  User, 
  Mail, 
  Phone, 
  FileText, 
  CreditCard, 
  AlertCircle,
  Calendar,
  MapPin,
  Shield,
  ArrowLeft,
  Download
} from 'lucide-react'
import AdminGuard from '@/components/guards/AdminGuard'

interface ClientDetails {
  id: string
  full_name: string
  email: string
  phone: string
  dob: string
  address: string
  created_at: string
  documents: Array<{
    id: string
    type: string
    file_url: string
    created_at: string
  }>
  credit_reports: Array<{
    id: string
    score: number
    synced_at: string
    data: any
  }>
  disputes: Array<{
    id: string
    bureau: string
    reason: string
    status: string
    created_at: string
  }>
}

export default function ClientDetail() {
  const { id } = router.query
  const [isLoading, setIsLoading] = useState(true)
  const [client, setClient] = useState<ClientDetails | null>(null)

  useEffect(() => {
    if (id) {
      fetchClientDetails()
    }
  }, [id])

  const fetchClientDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          id,
          full_name,
          email,
          phone,
          dob,
          address,
          created_at,
          documents (
            id,
            type,
            file_url,
            created_at
          ),
          credit_reports (
            id,
            score,
            synced_at,
            data
          ),
          disputes (
            id,
            bureau,
            reason,
            status,
            created_at
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      setClient(data)
    } catch (error) {
      console.error('Error fetching client details:', error)
      toast.error('Failed to load client details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogAction = async (action: string, details: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      await supabase.from('admin_logs').insert({
        admin_id: user.id,
        action,
        details,
        client_id: id
      })
    } catch (error) {
      console.error('Error logging action:', error)
    }
  }

  const handleDownloadCasePack = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const response = await fetch('/api/generate-case-pack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: client.user_id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate case pack');
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `case-pack-${client.id}.zip`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({ title: 'Case pack downloaded successfully!' });
    } catch (err: any) {
      toast({ 
        title: 'Failed to download case pack', 
        description: err.message,
        variant: 'destructive'
      });
    }
  };

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
          <h2 className="text-2xl font-bold text-gray-900">Client Not Found</h2>
          <Button
            onClick={() => router.push('/admin/clients')}
            className="mt-4"
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
              onClick={() => router.push('/admin/clients')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clients
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">{client.full_name}</h1>
            <p className="text-gray-600 mt-2">Client Details</p>
          </div>

          <div className="flex justify-end mb-4">
            <Button
              onClick={handleDownloadCasePack}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Case File
            </Button>
          </div>

          {/* Client Info Card */}
          <Card className="p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <span>{client.full_name}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <span>{client.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <span>{client.phone}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <span>DOB: {new Date(client.dob).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <span>{client.address}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-gray-400" />
                  <span>SSN: ••••{client.ssn_last4}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="documents" className="space-y-6">
            <TabsList>
              <TabsTrigger value="documents">
                <FileText className="h-4 w-4 mr-2" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="credit">
                <CreditCard className="h-4 w-4 mr-2" />
                Credit Reports
              </TabsTrigger>
              <TabsTrigger value="disputes">
                <AlertCircle className="h-4 w-4 mr-2" />
                Disputes
              </TabsTrigger>
            </TabsList>

            {/* Documents Tab */}
            <TabsContent value="documents">
              <Card className="p-6">
                <div className="space-y-4">
                  {client.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{doc.type}</p>
                        <p className="text-sm text-gray-500">
                          Uploaded {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => window.open(doc.file_url, '_blank')}
                      >
                        View Document
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* Credit Reports Tab */}
            <TabsContent value="credit">
              <Card className="p-6">
                <div className="space-y-4">
                  {client.credit_reports.map((report) => (
                    <div
                      key={report.id}
                      className="p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="font-medium">Credit Score: {report.score}</p>
                          <p className="text-sm text-gray-500">
                            Synced {new Date(report.synced_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            handleLogAction('view_credit_report', { report_id: report.id })
                            // Add credit report view logic
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* Disputes Tab */}
            <TabsContent value="disputes">
              <Card className="p-6">
                <div className="space-y-4">
                  {client.disputes.map((dispute) => (
                    <div
                      key={dispute.id}
                      className="p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{dispute.bureau}</p>
                          <p className="text-sm text-gray-500">{dispute.reason}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-sm ${
                          dispute.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          dispute.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {dispute.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Created {new Date(dispute.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminGuard>
  )
} 