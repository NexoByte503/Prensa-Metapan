import { RouterProvider } from 'react-router-dom'

import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { AuthProvider } from '@/contexts'
import { router } from '@/routes/router'

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ErrorBoundary>
  )
}
