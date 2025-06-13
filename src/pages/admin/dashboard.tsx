import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { Users, CreditCard, FileText, AlertCircle, BarChart2, Settings, Bell } from 'lucide-react'
import AdminGuard from '@/components/guards/AdminGuard'
import { SystemHealth } from '@/components/admin/SystemHealth'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { DisputeMetrics } from '@/components/admin/DisputeMetrics'
import { DisputePrioritization } from '@/components/admin/DisputePrioritization'
import { AtRiskUsers } from '@/components/admin/AtRiskUsers'

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
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // Get current admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('No user found')

        // Verify admin role
        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('*')
          .eq('id', user.id)
          .single()

        if (adminError || !adminData) throw new Error('Not authorized')

        // Fetch stats
        const [
          { count: totalClients },
          { count: activeDisputes },
          { count: pendingDocuments },
          { count: recentCreditReports },
          { data: feedbackData },
          { count: totalFeedback }
        ] = await Promise.all([
          supabase.from('clients').select('*', { count: 'exact', head: true }),
          supabase.from('disputes').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
          supabase.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('credit_reports').select('*', { count: 'exact', head: true })
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
          supabase.from('client_feedback').select('*, user:user_id(email)').order('created_at', { ascending: false }).limit(5),
          supabase.from('client_feedback').select('*', { count: 'exact', head: true })
        ])

        // Calculate average rating
        const averageRating = feedbackData
          ? feedbackData.reduce((acc, curr) => acc + (curr.rating || 0), 0) / feedbackData.length
          : 0

        setStats({
          totalClients: totalClients || 0,
          activeDisputes: activeDisputes || 0,
          pendingDocuments: pendingDocuments || 0,
          recentCreditReports: recentCreditReports || 0,
          totalFeedback: totalFeedback || 0,
          averageRating
        })

        setFeedback(feedbackData || [])

        // Fetch recent activity
        const { data: activityData, error: activityError } = await supabase
          .from('admin_logs')
          .select(`
            id,
            action,
            timestamp,
            details,
            clients (
              full_name
            )
          `)
          .order('timestamp', { ascending: false })
          .limit(10)

        if (activityError) throw activityError

        setRecentActivity(activityData.map(log => ({
          id: log.id,
          type: log.action,
          client_name: log.clients?.full_name || 'Unknown',
          timestamp: log.timestamp,
          details: log.details
        })))
      } catch (error) {
        console.error('Admin dashboard data fetch error:', error)
        toast.error('Failed to load admin dashboard data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAdminData()

    // Set up real-time subscriptions
    const subscriptions = [
      supabase
        .channel('admin_logs')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'admin_logs'
          },
          (payload) => {
            setRecentActivity(prev => [{
              id: payload.new.id,
              type: payload.new.action,
              client_name: payload.new.clients?.full_name || 'Unknown',
              timestamp: payload.new.timestamp,
              details: payload.new.details
            }, ...prev].slice(0, 10))
          }
        ),
      supabase
        .channel('client_feedback')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'client_feedback'
          },
          (payload) => {
            setFeedback(prev => [payload.new, ...prev].slice(0, 5))
          }
        )
    ]

    subscriptions.forEach(sub => sub.subscribe())

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe())
    }
  }, [])

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6">
                  <div className="flex items-center space-x-3">
                    <Users className="h-6 w-6 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-500">Total Clients</p>
                      <p className="text-2xl font-bold">{stats?.totalClients}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-6 w-6 text-red-500" />
                    <div>
                      <p className="text-sm text-gray-500">Active Disputes</p>
                      <p className="text-2xl font-bold">{stats?.activeDisputes}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-6 w-6 text-purple-500" />
                    <div>
                      <p className="text-sm text-gray-500">Pending Documents</p>
                      <p className="text-2xl font-bold">{stats?.pendingDocuments}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-6 w-6 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-500">Recent Reports</p>
                      <p className="text-2xl font-bold">{stats?.recentCreditReports}</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <BarChart2 className="h-6 w-6 text-gray-500" />
                    <h2 className="text-lg font-medium">Recent Activity</h2>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/admin/activity')}
                  >
                    View All
                  </Button>
                </div>

                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{activity.type}</p>
                        <p className="text-sm text-gray-500">
                          Client: {activity.client_name}
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
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
                    <Bell className="h-6 w-6 text-gray-500" />
                    <h2 className="text-lg font-medium">Client Feedback</h2>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-500">
                      Average Rating: {stats?.averageRating.toFixed(1)}/5
                    </div>
                    <div className="text-sm text-gray-500">
                      Total Feedback: {stats?.totalFeedback}
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

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Button
              onClick={() => router.push('/admin/clients')}
              className="w-full h-24 text-lg"
            >
              Manage Clients
            </Button>
            <Button
              onClick={() => router.push('/admin/disputes')}
              className="w-full h-24 text-lg"
            >
              Handle Disputes
            </Button>
            <Button
              onClick={() => router.push('/admin/settings')}
              className="w-full h-24 text-lg"
            >
              System Settings
            </Button>
          </div>
        </div>
      </div>
    </AdminGuard>
  )
} 