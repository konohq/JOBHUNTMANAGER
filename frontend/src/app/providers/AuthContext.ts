import { createContext } from 'react'
import type { LoginInput, SignupInput, AuthStatus, User } from '../../features/auth/types'

export type AuthContextValue = {
  user: User | null
  status: AuthStatus
  login: (input: LoginInput) => Promise<void>
  signup: (input: SignupInput) => Promise<void>
  logout: () => Promise<void>
  retryAuthentication: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
