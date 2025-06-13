import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { AdminGuard } from '@/components/guards/AdminGuard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { Users, FileText, AlertCircle, Activity, ArrowRight } from 'lucide-react'
import { SystemHealth } from '@/components/admin/SystemHealth'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { DisputeMetrics } from '@/components/admin/DisputeMetrics'
import { DisputePrioritization } from '@/components/admin/DisputePrioritization'
import { AtRiskUsers } from '@/components/admin/AtRiskUsers'

interface DashboardStats {
  totalClients: number
  activeDisputes: number
  pendingDocuments: number
  recentActivity: Array<{
    id: string
    action: string
    timestamp: string
    client_name: string
  }>
}

interface AdminStats {
  totalClients: number
  activeDisputes: number
  pendingDocuments: number
  recentCreditReports: number
  totalFeedback: number
  averageRating: number
}

interface RecentActivity {
  id: string
  type: string
  client_name: string
  timestamp: string
  details: any
}

interface Feedback {
  id: string
  message: string
  type: string
  rating: number
  created_at: string
  user: {
    email: string
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeDisputes: 0,
    pendingDocuments: 0,
    recentActivity: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      // Fetch total clients
      const { count: totalClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })

      // Fetch active disputes
      const { count: activeDisputes } = await supabase
        .from('disputes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // Fetch pending documents
      const { count: pendingDocuments } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // Fetch recent activity
      const { data: recentActivity } = await supabase
        .from('admin_logs')
        .select(`
          id,
          action,
          timestamp,
          clients (
            full_name
          )
        `)
        .order('timestamp', { ascending: false })
        .limit(5)

      setStats({
        totalClients: totalClients || 0,
        activeDisputes: activeDisputes || 0,
        pendingDocuments: pendingDocuments || 0,
        recentActivity: recentActivity?.map(log => ({
          id: log.id,
          action: log.action,
          timestamp: log.timestamp,
          client_name: log.clients?.full_name || 'Unknown'
        })) || []
      })

      // Fetch feedback
      const { data: feedbackData } = await supabase
        .from('client_feedback')
        .select('*, user:user_id(email)').order('created_at', { ascending: false }).limit(5)

      setFeedback(feedbackData || [])
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
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
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Monitor and manage client activities</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="system">System Health</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
              <TabsTrigger value="prioritization">Prioritization</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
              <TabsTrigger value="at-risk">At-Risk Users</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Clients</p>
                      <p className="text-2xl font-bold">{stats.totalClients}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                  <Button
                    variant="ghost"
                    className="mt-4 w-full"
                    onClick={() => navigate('/admin/clients')}
                  >
                    View Clients
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Disputes</p>
                      <p className="text-2xl font-bold">{stats.activeDisputes}</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-yellow-500" />
                  </div>
                  <Button
                    variant="ghost"
                    className="mt-4 w-full"
                    onClick={() => navigate('/admin/disputes')}
                  >
                    View Disputes
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Documents</p>
                      <p className="text-2xl font-bold">{stats.pendingDocuments}</p>
                    </div>
                    <FileText className="h-8 w-8 text-green-500" />
                  </div>
                  <Button
                    variant="ghost"
                    className="mt-4 w-full"
                    onClick={() => navigate('/admin/documents')}
                  >
                    View Documents
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Recent Activity</h2>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/admin/activity')}
                  >
                    View All
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
                <div className="space-y-4">
                  {stats.recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <Activity className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{activity.action}</p>
                          <p className="text-sm text-gray-500">
                            {activity.client_name} • {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="system">
              <SystemHealth />
            </TabsContent>

            <TabsContent value="metrics">
              <DisputeMetrics />
            </TabsContent>

            <TabsContent value="prioritization">
              <DisputePrioritization />
            </TabsContent>

            <TabsContent value="feedback">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <Badge variant="default">
                      Average Rating: {feedback.reduce((acc, curr) => acc + (curr.rating || 0), 0) / feedback.length}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-500">
                      Total Feedback: {feedback.length}
                    </div>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedback.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge variant={item.type === 'experience' ? 'default' : 'secondary'}>
                            {item.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-md truncate">{item.message}</TableCell>
                        <TableCell>{item.rating || '-'}</TableCell>
                        <TableCell>{item.user?.email}</TableCell>
                        <TableCell>
                          {new Date(item.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="at-risk">
              <AtRiskUsers />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminGuard>
  )
} 