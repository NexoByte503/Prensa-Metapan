# Fase 6 — Auditoría y preparación de lanzamiento

Fecha de revisión: 2026-11-20.

## Resultado

La aplicación compila y las pruebas de regresión locales pasan. Se corrigió la configuración Vercel para añadir cabeceras de seguridad, se quitó el `robots.txt` estático que impedía usar el endpoint por entorno, y se vaciaron las credenciales de ejemplo. No se desplegó el sitio ni se alteró Supabase.

## Verificaciones ejecutadas

| Área | Resultado |
| --- | --- |
| `npm run test` | 5 pruebas aprobadas: escape HTML/SSR, URLs seguras, robots en ambos modos, rewrites y cabeceras Vercel. |
| `npm run typecheck` | Aprobado. |
| `npm run build` | Aprobado en esta revisión. |
| `npm run lint` | Código de salida 0; hay avisos existentes de hooks/exports/props que requieren revisión. |
| Variables locales | Se inspeccionaron solo nombres y exclusión de Git; no se imprimieron valores. `.env` está ignorado y no está versionado. |
| Supabase RLS | No ejecutado: Supabase CLI no está instalado. No se conectó a un proyecto remoto. |
| Navegador/dispositivos | Pendiente: no se realizó comprobación visual de anchos ni recorrido funcional con credenciales reales. |
| Vercel / SEO publicado | Pendiente de despliegue; las respuestas dinámicas y cabeceras aún deben verificarse en el dominio. |

Las pruebas automáticas se ejecutan con `npm run test` usando `node:test`; no requieren red ni datos reales. Las pruebas RLS ya existentes están separadas y no deben ejecutarse contra producción.

## Hallazgos corregidos

- JSON inválido en `vercel.json` al incorporar cabeceras; una prueba lo detectó antes del cierre y se corrigió.
- Un archivo estático `public/robots.txt` bloqueaba el funcionamiento del endpoint `/api/robots` por configuración de despliegue; se quitó para que el rewrite dinámico controle indexación.
- `.env.example` contenía valores de un proyecto concreto; ahora tiene valores vacíos y no revela ni reutiliza esas credenciales al copiar el ejemplo.
- La documentación de seguridad describía una fase antigua y controles ausentes; se actualizó al estado comprobado y a tareas pendientes.

## Preparación de lanzamiento

**No listo para marcar como lanzado.** Antes de publicar falta verificar en staging: migraciones/RLS, cuentas de personal, login y recuperación, comentarios/moderación, anuncios/analítica, embeds y CSP, formularios, vistas móviles, accesibilidad, Core Web Vitals, dominio canónico, sitemap/robots, Search Console, correo SMTP y textos legales. Ninguno de esos pasos requiere usar credenciales reales en esta auditoría local.

El bundle se genera en build, pero esta revisión no mide Core Web Vitals ni Lighthouse. El lint no reporta errores de salida, aunque conserva advertencias React que conviene atender antes de declarar cero avisos.
