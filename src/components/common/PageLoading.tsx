export function PageLoading() {
  return (
    <div className="flex min-h-[45vh] items-center justify-center" role="status" aria-live="polite">
      <span className="sr-only">Cargando contenido…</span>
      <span
        aria-hidden="true"
        className="h-7 w-7 animate-spin rounded-full border-2 border-rule border-t-brand motion-reduce:animate-none"
      />
    </div>
  )
}
