import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { CreditCard, TrendingUp, AlertCircle, FileText } from 'lucide-react'
import ClientGuard from '@/components/guards/ClientGuard'

interface CreditReport {
  score: number
  accounts: Array<{
    name: string
    balance: number
    limit: number
    type: string
  }>
  disputes: Array<{
    bureau: string
    status: string
    date: string
  }>
  collections: Array<{
    name: string
    amount: number
    date: string
  }>
}

export default function CreditReport() {
  const [isLoading, setIsLoading] = useState(true)
  const [report, setReport] = useState<CreditReport | null>(null)

  useEffect(() => {
    const fetchCreditReport = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('No user found')

        const { data, error } = await supabase
          .from('credit_reports')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (error) throw error

        setReport(data.data)
      } catch (error) {
        console.error('Credit report fetch error:', error)
        toast.error('Failed to load credit report')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCreditReport()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="p-8 text-center">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">No Credit Report Available</h1>
            <p className="text-gray-600 mb-6">
              You need to sync your credit report to view this information.
            </p>
            <Button
              onClick={() => router.push('/credit-sync')}
              className="w-full max-w-xs"
            >
              Sync Credit Report
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <ClientGuard>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="space-y-6">
            {/* Score Card */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <CreditCard className="h-6 w-6 text-blue-500" />
                <h3 className="text-lg font-medium">Credit Score</h3>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold text-gray-900 mb-2">
                  {report.score}
                </div>
                <div className="text-sm text-gray-500">
                  Last updated {new Date().toLocaleDateString()}
                </div>
              </div>
            </Card>

            {/* Accounts Card */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <TrendingUp className="h-6 w-6 text-green-500" />
                <h3 className="text-lg font-medium">Credit Accounts</h3>
              </div>
              <div className="space-y-4">
                {report.accounts.map((account, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{account.name}</h4>
                      <span className="text-sm text-gray-500">{account.type}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Balance:</span>
                        <span className="ml-2">${account.balance.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Limit:</span>
                        <span className="ml-2">${account.limit.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Disputes Card */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertCircle className="h-6 w-6 text-red-500" />
                <h3 className="text-lg font-medium">Active Disputes</h3>
              </div>
              <div className="space-y-4">
                {report.disputes.map((dispute, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{dispute.bureau}</h4>
                      <span className="text-sm text-gray-500">{dispute.status}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Filed on {new Date(dispute.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Collections Card */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="h-6 w-6 text-purple-500" />
                <h3 className="text-lg font-medium">Collections</h3>
              </div>
              <div className="space-y-4">
                {report.collections.map((collection, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{collection.name}</h4>
                      <span className="text-sm text-gray-500">
                        ${collection.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Reported on {new Date(collection.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="flex justify-center">
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
                className="w-full max-w-xs"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ClientGuard>
  )
} 