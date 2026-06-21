import type { AxiosResponse } from 'axios'
import { apiClient } from '../../../shared/api/client'
import type { ApiResponse } from '../../../shared/types/api'
import type { LoginInput, SignupInput, User } from '../types'

const extractToken = (response: AxiosResponse<ApiResponse<User>>): string => {
  const authorization = response.headers.authorization

  if (typeof authorization !== 'string') {
    throw new Error('認証トークンを取得できませんでした。')
  }

  const token = authorization.replace(/^Bearer\s+/i, '').trim()

  if (!token) {
    throw new Error('認証トークンを取得できませんでした。')
  }

  return token
}

export const authApi = {
  async login(input: LoginInput): Promise<{ user: User; token: string }> {
    const response = await apiClient.post<ApiResponse<User>>('/api/v1/auth/sign_in', {
      user: input,
    })

    return {
      user: response.data.data,
      token: extractToken(response),
    }
  },

  async signup(input: SignupInput): Promise<{ user: User; token: string }> {
    const response = await apiClient.post<ApiResponse<User>>('/api/v1/auth', {
      user: {
        name: input.name,
        email: input.email,
        password: input.password,
        password_confirmation: input.passwordConfirmation,
      },
    })

    return {
      user: response.data.data,
      token: extractToken(response),
    }
  },

  async me(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>('/api/v1/auth/me')
    return response.data.data
  },

  async logout(): Promise<void> {
    await apiClient.delete('/api/v1/auth/sign_out')
  },
}
