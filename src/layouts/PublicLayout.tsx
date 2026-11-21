import { Suspense } from 'react'
import { Outlet, ScrollRestoration } from 'react-router-dom'

import { PageLoading } from '@/components/common/PageLoading'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { AdSlot } from '@/components/ads/AdSlot'
import { PageViewTracker } from '@/components/analytics/PageViewTracker'

export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollRestoration />
      <PageViewTracker />

      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Saltar al contenido
      </a>

      <SiteHeader />
      <div className="px-4 pt-3"><AdSlot placement="header_banner" /></div>

      <main id="contenido" tabIndex={-1} className="flex-1 focus:outline-none">
        <Suspense fallback={<PageLoading />}>
          <Outlet />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  )
}
