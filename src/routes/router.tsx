import { createBrowserRouter } from 'react-router-dom'

import { RequireAuth } from '@/components/auth'
import { AdminAuthLayout } from '@/layouts/AdminAuthLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { PublicLayout } from '@/layouts/PublicLayout'
import RouteErrorPage from '@/pages/RouteErrorPage'
import {
  AboutPage,
  AdminCategoriasPage,
  AdminComentariosPage,
  AdminTransmisionesPage,
  AdminPublicidadPage,
  AdminEstadisticasPage,
  AdminEditArticlePage,
  AdminForgotPasswordPage,
  AdminHomePage,
  AdminLoginPage,
  AdminMultimediaPage,
  AdminNewArticlePage,
  AdminNotFoundPage,
  AdminNoticiasPage,
  AdminResetPasswordPage,
  AdminUsuariosPage,
  ArticlePage,
  CategoryPage,
  ContactPage,
  EditorialPolicyPage,
  HomePage,
  NewsPage,
  NotFoundPage,
  PrivacyPage,
  SearchPage,
  TermsPage,
} from '@/routes/routePages'
import { paths } from '@/routes/paths'

export const router = createBrowserRouter([
  {
    path: paths.home,
    element: <PublicLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'noticias', element: <NewsPage /> },
      { path: 'noticias/:slug', element: <ArticlePage /> },
      { path: 'categorias/:slug', element: <CategoryPage /> },
      { path: 'buscar', element: <SearchPage /> },
      { path: 'quienes-somos', element: <AboutPage /> },
      { path: 'contacto', element: <ContactPage /> },
      { path: 'politica-editorial', element: <EditorialPolicyPage /> },
      { path: 'privacidad', element: <PrivacyPage /> },
      { path: 'terminos', element: <TermsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    element: <AdminAuthLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: paths.adminLogin, element: <AdminLoginPage /> },
      { path: paths.adminForgotPassword, element: <AdminForgotPasswordPage /> },
      { path: paths.adminResetPassword, element: <AdminResetPasswordPage /> },
    ],
  },
  {
    path: paths.admin,
    element: <RequireAuth />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminHomePage /> },
          { path: 'noticias', element: <AdminNoticiasPage /> },
          { path: 'noticias/nueva', element: <AdminNewArticlePage /> },
          { path: 'noticias/editar/:id', element: <AdminEditArticlePage /> },
          { path: 'categorias', element: <AdminCategoriasPage /> },
          { path: 'multimedia', element: <AdminMultimediaPage /> },
          { path: 'comentarios', element: <AdminComentariosPage /> },
          { path: 'transmisiones', element: <AdminTransmisionesPage /> },
          { path: 'publicidad', element: <AdminPublicidadPage /> },
          { path: 'estadisticas', element: <AdminEstadisticasPage /> },
          { path: 'usuarios', element: <AdminUsuariosPage /> },
          { path: '*', element: <AdminNotFoundPage /> },
        ],
      },
    ],
  },
])
