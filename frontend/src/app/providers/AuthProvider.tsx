import { useCallback, useEffect, useRef, useState, type PropsWithChildren } from 'react'
import { authApi } from '../../features/auth/api/authApi'
import { tokenStorage } from '../../features/auth/storage/tokenStorage'
import type { AuthStatus, LoginInput, SignupInput, User } from '../../features/auth/types'
import { isUnauthorizedError } from '../../shared/api/apiError'
import { setUnauthorizedHandler } from '../../shared/api/client'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')
  const initialized = useRef(false)

  const clearSession = useCallback(() => {
    tokenStorage.remove()
    setUser(null)
    setStatus('unauthenticated')
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(clearSession)
    return () => setUnauthorizedHandler(null)
  }, [clearSession])

  const restoreSession = useCallback(async () => {
    if (!tokenStorage.get()) {
      setUser(null)
      setStatus('unauthenticated')
      return
    }

    setStatus('loading')

    try {
      const currentUser = await authApi.me()
      setUser(currentUser)
      setStatus('authenticated')
    } catch (error) {
      if (isUnauthorizedError(error)) {
        clearSession()
        return
      }

      setUser(null)
      setStatus('error')
    }
  }, [clearSession])

  useEffect(() => {
    if (initialized.current) {
      return
    }

    initialized.current = true

    void restoreSession()
  }, [restoreSession])

  const login = async (input: LoginInput) => {
    const result = await authApi.login(input)
    tokenStorage.set(result.token)
    setUser(result.user)
    setStatus('authenticated')
  }

  const signup = async (input: SignupInput) => {
    const result = await authApi.signup(input)
    tokenStorage.set(result.token)
    setUser(result.user)
    setStatus('authenticated')
  }

  const logout = async () => {
    try {
      await authApi.logout()
      clearSession()
    } catch (error) {
      if (isUnauthorizedError(error)) {
        clearSession()
        return
      }

      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, status, login, signup, logout, retryAuthentication: restoreSession }}
    >
      {children}
    </AuthContext.Provider>
  )
}
