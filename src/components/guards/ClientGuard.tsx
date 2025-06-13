import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

interface ClientGuardProps {
  children: React.ReactNode
}

export const ClientGuard: React.FC<ClientGuardProps> = ({ children }) => {
  const { user, loading, isClient } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        toast.error('Please log in to access this page')
        navigate('/login')
        return
      }

      if (!isClient) {
        toast.error('Client access required')
        navigate('/admin')
        return
      }
    }
  }, [user, loading, isClient, navigate])

  if (loading) {
    return <div>Loading...</div>
  }

  return <>{children}</>
} 