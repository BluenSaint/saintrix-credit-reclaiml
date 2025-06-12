import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface DisputeMetrics {
  totalDisputes: number
  successfulDisputes: number
  averageTimeToResolution: number
  successRate: number
  monthlyTrends: {
    month: string
    disputes: number
    successRate: number
  }[]
}

export function DisputeMetrics() {
  const [metrics, setMetrics] = useState<DisputeMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMetrics() {
      try {
        // Get total disputes
        const { count: totalDisputes } = await supabase
          .from('disputes')
          .select('*', { count: 'exact', head: true })

        // Get successful disputes (status = 'resolved')
        const { count: successfulDisputes } = await supabase
          .from('disputes')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'resolved')

        // Calculate average time to resolution
        const { data: resolvedDisputes } = await supabase
          .from('disputes')
          .select('created_at, resolved_at')
          .eq('status', 'resolved')

        const averageTimeToResolution = resolvedDisputes
          ? resolvedDisputes.reduce((acc, dispute) => {
              const created = new Date(dispute.created_at)
              const resolved = new Date(dispute.resolved_at)
              return acc + (resolved.getTime() - created.getTime())
            }, 0) / resolvedDisputes.length / (1000 * 60 * 60 * 24) // Convert to days
          : 0

        // Get monthly trends
        const { data: monthlyData } = await supabase
          .from('disputes')
          .select('created_at, status')
          .order('created_at', { ascending: true })

        const monthlyTrends = monthlyData
          ? Object.entries(
              monthlyData.reduce((acc, dispute) => {
                const month = new Date(dispute.created_at).toLocaleString('default', {
                  month: 'short',
                  year: 'numeric',
                })
                if (!acc[month]) {
                  acc[month] = { total: 0, resolved: 0 }
                }
                acc[month].total++
                if (dispute.status === 'resolved') {
                  acc[month].resolved++
                }
                return acc
              }, {} as Record<string, { total: number; resolved: number }>)
            ).map(([month, data]) => ({
              month,
              disputes: data.total,
              successRate: (data.resolved / data.total) * 100,
            }))
          : []

        setMetrics({
          totalDisputes: totalDisputes || 0,
          successfulDisputes: successfulDisputes || 0,
          averageTimeToResolution,
          successRate: totalDisputes
            ? (successfulDisputes || 0) / totalDisputes * 100
            : 0,
          monthlyTrends,
        })
      } catch (error) {
        console.error('Error fetching dispute metrics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [])

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </Card>
    )
  }

  if (!metrics) {
    return null
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Dispute Success Metrics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-600">Total Disputes</h3>
          <p className="text-2xl font-bold text-blue-900">{metrics.totalDisputes}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-600">Successful Disputes</h3>
          <p className="text-2xl font-bold text-green-900">{metrics.successfulDisputes}</p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-purple-600">Success Rate</h3>
          <p className="text-2xl font-bold text-purple-900">
            {metrics.successRate.toFixed(1)}%
          </p>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-orange-600">Avg. Resolution Time</h3>
          <p className="text-2xl font-bold text-orange-900">
            {metrics.averageTimeToResolution.toFixed(1)} days
          </p>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={metrics.monthlyTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="disputes"
              stroke="#3b82f6"
              name="Number of Disputes"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="successRate"
              stroke="#10b981"
              name="Success Rate (%)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
} 