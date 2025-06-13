import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

interface AdminGuardProps {
  children: React.ReactNode
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const { user, loading, isAdmin } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        toast.error('Please log in to access this page')
        navigate('/admin-login')
        return
      }

      if (!isAdmin) {
        toast.error('Admin access required')
        navigate('/admin-login')
        return
      }
    }
  }, [user, loading, isAdmin, navigate])

  if (loading) {
    return <div>Loading...</div>
  }

  return <>{children}</>
} 