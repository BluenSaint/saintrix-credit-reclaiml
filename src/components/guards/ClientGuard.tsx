import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface ClientGuardProps {
  children: React.ReactNode
}

export default function ClientGuard({ children }: ClientGuardProps) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkClientAccess = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
          router.push('/login')
          return
        }

        // Check if user is not an admin
        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (!adminError && adminData?.role === 'admin') {
          router.push('/admin')
          return
        }

        setIsLoading(false)
      } catch (error) {
        console.error('Client access check failed:', error)
        router.push('/login')
      }
    }

    checkClientAccess()
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