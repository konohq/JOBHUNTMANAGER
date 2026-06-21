import { Navigate, Route, Routes } from 'react-router-dom'
import { KanbanPage } from '../pages/KanbanPage'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { SignupPage } from '../pages/SignupPage'
import { GuestRoute } from '../shared/routes/GuestRoute'
import { ProtectedRoute } from '../shared/routes/ProtectedRoute'
import { AppLayout } from './layouts/AppLayout'
import { AuthLayout } from './layouts/AuthLayout'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/kanban" element={<KanbanPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/kanban" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
