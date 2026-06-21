export type User = {
  id: number
  name: string
  email: string
}

export type LoginInput = {
  email: string
  password: string
}

export type SignupInput = {
  name: string
  email: string
  password: string
  passwordConfirmation: string
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error'
