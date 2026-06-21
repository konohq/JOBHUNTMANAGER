import axios from 'axios'
import type { ApiErrorBody } from '../types/api'

const DEFAULT_ERROR_MESSAGE = '通信に失敗しました。時間をおいて再度お試しください。'

export const isUnauthorizedError = (error: unknown): boolean =>
  axios.isAxiosError(error) && error.response?.status === 401

export const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof Error && !axios.isAxiosError(error)) {
    return error.message
  }

  if (!axios.isAxiosError<ApiErrorBody>(error)) {
    return DEFAULT_ERROR_MESSAGE
  }

  if (!error.response) {
    return 'サーバーに接続できません。APIが起動しているか確認してください。'
  }

  return error.response.data?.error?.message ?? DEFAULT_ERROR_MESSAGE
}
