import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

const ADMIN_ACCESS_CODE = 'SAINTRIX-SUPER-ACCESS-2024'

export default function AdminLogin() {
  const router = useRouter()
  const [accessCode, setAccessCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    if (!accessCode) {
      toast.error('Please enter an access code')
      return
    }

    setIsLoading(true)
    try {
      // Verify access code
      if (accessCode !== ADMIN_ACCESS_CODE) {
        throw new Error('Invalid access code')
      }

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        throw new Error('No active session')
      }

      // Update user role to admin
      const { error: updateError } = await supabase
        .from('admins')
        .upsert({
          id: session.user.id,
          role: 'admin',
          created_at: new Date().toISOString()
        })

      if (updateError) {
        throw new Error('Failed to set admin role')
      }

      // Update session metadata
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { role: 'admin' }
      })

      if (metadataError) {
        throw new Error('Failed to update session')
      }

      toast.success('Admin access granted')
      router.push('/admin')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8">Admin Access</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Access Code
            </label>
            <Input
              type="password"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="Enter admin access code"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Verifying...' : 'Access Admin Panel'}
          </Button>
        </div>
      </Card>
    </div>
  )
} 