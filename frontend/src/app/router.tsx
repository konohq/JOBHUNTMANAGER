import { Navigate, Route, Routes } from 'react-router-dom'
import { ApplicationDetailPage } from '../pages/ApplicationDetailPage'
import { JobDetailPage } from '../pages/JobDetailPage'
import { JobEditPage } from '../pages/JobEditPage'
import { JobNewPage } from '../pages/JobNewPage'
import { JobsPage } from '../pages/JobsPage'
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
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/new" element={<JobNewPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
          <Route path="/jobs/:id/edit" element={<JobEditPage />} />
          <Route
            path="/applications/:id"
            element={<ApplicationDetailPage />}
          />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/kanban" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
