import { useContext } from 'react'
import { AuthContext } from '../../../app/providers/AuthContext'

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuthはAuthProvider内で使用してください。')
  }

  return context
}
