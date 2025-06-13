import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Search, AlertCircle, Filter, ArrowUpDown } from 'lucide-react'
import AdminGuard from '@/components/guards/AdminGuard'

interface Dispute {
  id: string
  bureau: string
  reason: string
  status: string
  created_at: string
  client: {
    id: string
    full_name: string
    email: string
  }
}

export default function AdminDisputes() {
  const [isLoading, setIsLoading] = useState(true)
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [bureauFilter, setBureauFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchDisputes()
  }, [sortBy, sortOrder])

  const fetchDisputes = async () => {
    try {
      const { data, error } = await supabase
        .from('disputes')
        .select(`
          id,
          bureau,
          reason,
          status,
          created_at,
          client:clients (
            id,
            full_name,
            email
          )
        `)
        .order(sortBy, { ascending: sortOrder === 'asc' })

      if (error) throw error
      setDisputes(data)
    } catch (error) {
      console.error('Error fetching disputes:', error)
      toast.error('Failed to load disputes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateStatus = async (disputeId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('disputes')
        .update({ status: newStatus })
        .eq('id', disputeId)

      if (error) throw error

      // Log the action
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('admin_logs').insert({
          admin_id: user.id,
          action: 'update_dispute_status',
          details: { dispute_id: disputeId, new_status: newStatus }
        })
      }

      toast.success('Dispute status updated')
      fetchDisputes()
    } catch (error) {
      console.error('Error updating dispute status:', error)
      toast.error('Failed to update dispute status')
    }
  }

  const filteredDisputes = disputes.filter(dispute => {
    const matchesSearch = 
      dispute.client.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.reason.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || dispute.status === statusFilter
    const matchesBureau = bureauFilter === 'all' || dispute.bureau === bureauFilter

    return matchesSearch && matchesStatus && matchesBureau
  })

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
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
            <h1 className="text-3xl font-bold text-gray-900">Dispute Management</h1>
            <p className="text-gray-600 mt-2">Handle and track client disputes</p>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search disputes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={bureauFilter} onValueChange={setBureauFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by bureau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bureaus</SelectItem>
                <SelectItem value="Experian">Experian</SelectItem>
                <SelectItem value="Equifax">Equifax</SelectItem>
                <SelectItem value="TransUnion">TransUnion</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter('all')
                setBureauFilter('all')
                setSearchQuery('')
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>

          {/* Disputes Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        className="flex items-center space-x-1"
                        onClick={() => handleSort('created_at')}
                      >
                        <span>Date</span>
                        <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bureau
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDisputes.map((dispute) => (
                    <tr key={dispute.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(dispute.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {dispute.client.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {dispute.client.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dispute.bureau}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {dispute.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          dispute.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          dispute.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {dispute.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Select
                          value={dispute.status}
                          onValueChange={(value) => handleUpdateStatus(dispute.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Update status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {filteredDisputes.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No disputes found</p>
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  )
} 