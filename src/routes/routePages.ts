import { lazy } from 'react'

export const HomePage = lazy(() => import('@/pages/public/HomePage'))
export const NewsPage = lazy(() => import('@/pages/public/NewsPage'))
export const ArticlePage = lazy(() => import('@/pages/public/ArticlePage'))
export const CategoryPage = lazy(() => import('@/pages/public/CategoryPage'))
export const SearchPage = lazy(() => import('@/pages/public/SearchPage'))
export const AboutPage = lazy(() => import('@/pages/public/AboutPage'))
export const ContactPage = lazy(() => import('@/pages/public/ContactPage'))
export const EditorialPolicyPage = lazy(() => import('@/pages/public/EditorialPolicyPage'))
export const PrivacyPage = lazy(() => import('@/pages/public/PrivacyPage'))
export const TermsPage = lazy(() => import('@/pages/public/TermsPage'))
export const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))
export const AdminHomePage = lazy(() => import('@/pages/admin/AdminHomePage'))
export const AdminLoginPage = lazy(() => import('@/pages/admin/AdminLoginPage'))
export const AdminForgotPasswordPage = lazy(
  () => import('@/pages/admin/AdminForgotPasswordPage'),
)
export const AdminResetPasswordPage = lazy(
  () => import('@/pages/admin/AdminResetPasswordPage'),
)
export const AdminNotFoundPage = lazy(() => import('@/pages/admin/AdminNotFoundPage'))
export const AdminNoticiasPage = lazy(() => import('@/pages/admin/AdminNoticiasPage'))
export const AdminNewArticlePage = lazy(() => import('@/pages/admin/AdminNewArticlePage'))
export const AdminEditArticlePage = lazy(() => import('@/pages/admin/AdminEditArticlePage'))
export const AdminCategoriasPage = lazy(() => import('@/pages/admin/AdminCategoriasPage'))
export const AdminMultimediaPage = lazy(() => import('@/pages/admin/AdminMultimediaPage'))
export const AdminUsuariosPage = lazy(() => import('@/pages/admin/AdminUsuariosPage'))
export const AdminComentariosPage = lazy(() => import('@/pages/admin/AdminComentariosPage'))
export const AdminTransmisionesPage = lazy(() => import('@/pages/admin/AdminTransmisionesPage'))
export const AdminPublicidadPage = lazy(() => import('@/pages/admin/AdminPublicidadPage'))
export const AdminEstadisticasPage = lazy(() => import('@/pages/admin/AdminEstadisticasPage'))
