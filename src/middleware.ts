import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

export const useAuthMiddleware = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading, isAdmin } = useAuth()

  useEffect(() => {
    if (!loading) {
      const path = location.pathname

      // Handle authentication
      if (!user) {
        if (path.startsWith('/admin') || path.startsWith('/dashboard')) {
          toast.error('Please log in to access this page')
          navigate('/login', { state: { from: path } })
          return
        }
      }

      // Handle role-based access
      if (path.startsWith('/admin')) {
        if (!isAdmin) {
          toast.error('Admin access required')
          navigate('/dashboard')
          return
        }
      }

      if (path.startsWith('/dashboard')) {
        if (isAdmin) {
          toast.error('Client access required')
          navigate('/admin')
          return
        }
      }
    }
  }, [user, loading, isAdmin, location.pathname, navigate])
} 