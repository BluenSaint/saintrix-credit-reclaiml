import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { CreditCard, Loader2 } from 'lucide-react'

interface CreditReportSyncProps {
  userId: string
  onSyncComplete: (reportData: any) => void
}

export default function CreditReportSync({ userId, onSyncComplete }: CreditReportSyncProps) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  })

  const simulateCreditReportSync = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Mock credit report data
    return {
      score: Math.floor(Math.random() * 150) + 500, // Random score between 500-650
      accounts: [
        {
          name: 'Chase Freedom',
          balance: 2500,
          limit: 5000,
          type: 'credit'
        },
        {
          name: 'Bank of America',
          balance: 1500,
          limit: 3000,
          type: 'credit'
        }
      ],
      disputes: [
        {
          bureau: 'Experian',
          status: 'in_progress',
          date: new Date().toISOString()
        }
      ],
      collections: [
        {
          name: 'Medical Bill',
          amount: 750,
          date: new Date().toISOString()
        }
      ]
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      // Simulate credit report sync
      const reportData = await simulateCreditReportSync()

      // Save to Supabase
      const { error: saveError } = await supabase
        .from('credit_reports')
        .insert({
          user_id: userId,
          score: reportData.score,
          data: reportData,
          synced_at: new Date().toISOString()
        })

      if (saveError) throw saveError

      // Notify parent component
      onSyncComplete(reportData)
      toast.success('Credit report synced successfully')
    } catch (error) {
      console.error('Sync error:', error)
      toast.error('Failed to sync credit report')
    } finally {
      setIsSyncing(false)
      setShowLoginForm(false)
    }
  }

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSync()
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <CreditCard className="h-6 w-6 text-blue-500" />
          <h3 className="text-lg font-medium">Sync Credit Report</h3>
        </div>

        {!showLoginForm ? (
          <Button
            onClick={() => setShowLoginForm(true)}
            disabled={isSyncing}
            className="w-full"
          >
            Connect Credit Karma / Experian
          </Button>
        ) : (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Username
              </label>
              <Input
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({
                  ...prev,
                  username: e.target.value
                }))}
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Password
              </label>
              <Input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({
                  ...prev,
                  password: e.target.value
                }))}
                placeholder="Enter password"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isSyncing}
              className="w-full"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                'Sync Report'
              )}
            </Button>
          </form>
        )}

        <p className="text-sm text-gray-500">
          We'll securely sync your credit report data to help identify potential disputes.
        </p>
      </div>
    </Card>
  )
} 