import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { AuthErrorScreen } from '../components/AuthErrorScreen'
import { LoadingScreen } from '../components/LoadingScreen'

export function GuestRoute() {
  const { status } = useAuth()

  if (status === 'loading') {
    return <LoadingScreen />
  }

  if (status === 'error') {
    return <AuthErrorScreen />
  }

  if (status === 'authenticated') {
    return <Navigate to="/kanban" replace />
  }

  return <Outlet />
}
