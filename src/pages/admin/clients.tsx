import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Search, User, Mail, Phone, FileText, CreditCard } from 'lucide-react'
import AdminGuard from '@/components/guards/AdminGuard'

interface Client {
  id: string
  full_name: string
  email: string
  phone: string
  created_at: string
  documents_count: number
  credit_reports_count: number
}

export default function AdminClients() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [clients, setClients] = useState<Client[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          id,
          full_name,
          email,
          phone,
          created_at,
          documents:documents(count),
          credit_reports:credit_reports(count)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setClients(data.map(client => ({
        ...client,
        documents_count: client.documents[0]?.count || 0,
        credit_reports_count: client.credit_reports[0]?.count || 0
      })))
    } catch (error) {
      console.error('Error fetching clients:', error)
      toast.error('Failed to load clients')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredClients = clients.filter(client =>
    client.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone.includes(searchQuery)
  )

  const handleViewClient = (clientId: string) => {
    router.push(`/admin/clients/${clientId}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    )
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Client Management</h1>
            <p className="text-gray-600 mt-2">View and manage client accounts</p>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search clients by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Clients Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <Card
                key={client.id}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleViewClient(client.id)}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <User className="h-6 w-6 text-blue-500" />
                  <h3 className="text-lg font-medium">{client.full_name}</h3>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{client.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{client.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <FileText className="h-4 w-4" />
                    <span>{client.documents_count} Documents</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <CreditCard className="h-4 w-4" />
                    <span>{client.credit_reports_count} Credit Reports</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    Joined {new Date(client.created_at).toLocaleDateString()}
                  </p>
                </div>
              </Card>
            ))}
          </div>

          {filteredClients.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No clients found</p>
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  )
} 