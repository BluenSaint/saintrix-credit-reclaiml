import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface AdminGuardProps {
  children: React.ReactNode
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
          router.push('/admin-login')
          return
        }

        // Check if user has admin role
        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (adminError || adminData?.role !== 'admin') {
          router.push('/admin-login')
          return
        }

        setIsLoading(false)
      } catch (error) {
        console.error('Admin access check failed:', error)
        router.push('/admin-login')
      }
    }

    checkAdminAccess()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    )
  }

  return <>{children}</>
} 