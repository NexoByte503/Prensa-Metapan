# Desarrollo — Prensa Metapán

## Requisitos

- Node.js 22.12 o superior.
- npm 10 o superior.
- Git.
- Docker Desktop y Supabase CLI (`npx supabase`) para trabajar con autenticación, base de datos o Storage local.

El portal público funciona sin Supabase. El panel `/admin`, las migraciones y las pruebas requieren el backend local o un proyecto remoto.

## Instalación

```bash
npm install
```

Copia las variables de entorno:

```powershell
Copy-Item .env.example .env
```

```bash
cp .env.example .env
```

Reinicia `npm run dev` después de cambiar variables. Vite solo expone al cliente las variables que comienzan con `VITE_`.

### Variables

| Variable | Uso |
| --- | --- |
| `VITE_SITE_URL` | URL pública para canonical y metadatos. |
| `VITE_SITE_INDEXABLE` | `true` solo cuando exista contenido real y revisado. |
| `VITE_SUPABASE_URL` | URL del proyecto de Supabase. |
| `VITE_SUPABASE_ANON_KEY` | Clave pública (anon o publishable) sujeta a RLS. |

Sin las dos variables de Supabase, `/admin` muestra un aviso de configuración. El portal público sigue funcionando.

Nunca coloques `service_role`, secret keys, SMTP ni contraseñas en variables `VITE_*`.

## Scripts

```bash
npm run dev        # Desarrollo
npm run build      # TypeScript + build de producción
npm run typecheck  # Solo verificación de tipos
npm run lint       # Oxlint
npm run preview    # Preview del build
```

Backend local:

```bash
npx supabase start       # Inicia PostgreSQL, Auth, API, Studio, Storage y correo
npx supabase status      # Muestra URLs y claves locales
npx supabase db reset    # Recrea la base y aplica las migraciones
npx supabase test db     # Ejecuta las pruebas RLS con pgTAP
npx supabase stop        # Detiene el entorno local
```

## Supabase local

### 1. Iniciar

Con Docker Desktop abierto:

```bash
npx supabase start
```

La primera ejecución descarga imágenes y puede tardar. Al finalizar muestra:

- API: `http://127.0.0.1:54321`
- Studio: `http://127.0.0.1:54323`
- Correo de prueba: `http://127.0.0.1:54324`
- PostgreSQL: `127.0.0.1:54322`

### 2. Configurar `.env`

Copia `API URL` y `anon key` en `.env`:

```dotenv
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<anon-key-local>
```

No copies estas claves a la documentación ni a Git. Son locales y efímeras.

Reinicia `npm run dev` para que Vite las lea.

### 3. Aplicar migraciones

```bash
npx supabase db reset
```

Esto recrea la base local y aplica, en orden:

1. Esquema.
2. Funciones y triggers.
3. RLS y permisos.
4. Storage.
5. Categorías iniciales.

`supabase/seed.sql` está vacío porque las categorías viven en una migración versionada.

### 4. Crear cuentas editoriales

En Studio (`http://127.0.0.1:54323`) → **Authentication → Users → Add user**:

- Crea la cuenta con correo y contraseña.
- Marca el correo como confirmado.
- No existe registro público: las cuentas solo se crean desde administración.

El trigger crea el perfil con rol `editor`.

Para promover al primer administrador, ejecuta una sola vez en el SQL Editor de Studio:

```sql
update public.profiles
set role = 'admin'
where email = 'admin@tu-dominio.test';
```

Después, los cambios de rol deben hacerse con la RPC `admin_set_user_role()` desde el panel de la Fase 3. No intentes cambiar el rol desde el navegador: los permisos de columna lo impiden.

### 5. Probar la recuperación de contraseña

1. Abre `/admin/recuperar-contrasena`.
2. Envía el formulario con un correo existente.
3. Abre `http://127.0.0.1:54324` y revisa el mensaje.
4. Sigue el enlace de recuperación.
5. Define una nueva contraseña y vuelve a iniciar sesión.

Si el enlace no redirige, revisa que `http://localhost:5173/admin/restablecer-contrasena` y `http://127.0.0.1:5173/admin/restablecer-contrasena` estén en `additional_redirect_urls` de `supabase/config.toml`.

### 6. Ejecutar pruebas RLS

```bash
npx supabase test db
```

Resultado esperado: `All tests successful` con 49 comprobaciones.

El archivo `supabase/tests/rls_checks.sql`:

- Crea usuarios, notas, comentarios y anuncios de prueba.
- Cambia de rol con JWT simulados.
- Termina con `ROLLBACK`: no deja datos.
- Degrada temporalmente otros admins locales para probar el "último admin"; todo se revierte.

**No ejecutar contra producción.**

### 7. Detener

```bash
npx supabase stop
```

Los datos locales se conservan hasta un `db reset` o `stop --no-backup`.

## Rutas de autenticación

| Ruta | Acceso | Función |
| --- | --- | --- |
| `/admin/login` | Público | Inicio de sesión editorial. |
| `/admin/recuperar-contrasena` | Público | Solicitar enlace de recuperación. |
| `/admin/restablecer-contrasena` | Sesión de recuperación | Definir nueva contraseña. |
| `/admin` | Solo autenticado | Estado del panel y perfil. |
| `/admin/*` | Solo autenticado | Futuras herramientas de Fase 3. |

Comportamiento:

- Sin sesión, `/admin` redirige a `/admin/login` conservando el destino.
- Con sesión, `/admin/login` redirige al panel.
- Al cerrar sesión se elimina la sesión local y se vuelve al login.
- El guard es una mejora de experiencia; RLS sigue siendo la autorización real.

## Convenciones

- **Componentes:** PascalCase, un componente exportado por archivo.
- **Hooks:** prefijo `use`, retorno explícito.
- **Utilidades:** camelCase, funciones puras.
- **Tipos:** `PascalCase`; imports de tipos con `import type`.
- **Rutas:** centralizadas en `routes/paths.ts` y `routes/router.tsx`.
- **Alias:** `@/` apunta a `src/`.
- **Tailwind:** usar tokens semánticos (`text-ink-muted`, `border-rule`), no colores sueltos.
- **Clases dinámicas:** no construir nombres de clases por concatenación; Tailwind necesita verlas completas en el código.
- **Sin datos ficticios:** cualquier demo de contenido debe identificarse como tal o resolverse con un estado vacío.
- **Seguridad:** nunca confiar en la validación del formulario como frontera; RLS y triggers validan de nuevo.

## TypeScript

`tsconfig.app.json` activa:

- `strict`
- `noUncheckedIndexedAccess`
- `noImplicitOverride`
- `noUnusedLocals`
- `noUnusedParameters`
- `erasableSyntaxOnly`

El build falla ante errores de tipos. No se permite `any` implícito.

`src/types/database.ts` refleja el esquema manualmente. Al cambiar una migración:

1. Actualiza los tipos Row/Insert/Update.
2. Actualiza relaciones, enums y funciones.
3. Ajusta los servicios.
4. Ejecuta `npm run typecheck`.
5. Cuando exista proyecto remoto, genera una referencia con `supabase gen types` y revisa el diff antes de reemplazar.

## Flujo para añadir una página

1. Crear el archivo en `src/pages/public/` o `src/pages/admin/`.
2. Exportar el componente como `default`.
3. Registrar la carga diferida en `src/routes/routePages.ts` y la ruta en `src/routes/router.tsx`.
4. Añadir `Seo` y verificar la jerarquía de encabezados (`h1` único).
5. Reutilizar `Container`, `PageHeader`, `ActionLink`, `EmptyState` y demás primitivas.
6. Verificar móvil, teclado y estado vacío.
7. Ejecutar `npm run build`.

Las páginas administrativas nuevas deben colgar de la rama protegida por `RequireAuth` y usar `noIndex`.

## Flujo para modificar el esquema

1. Crear una migración nueva; no editar una ya aplicada en producción.
2. Añadir tablas, restricciones, funciones, triggers, RLS y Storage según corresponda.
3. Actualizar `src/types/database.ts` y los servicios.
4. Añadir o ajustar las pruebas en `supabase/tests/`.
5. Ejecutar `npx supabase db reset`.
6. Ejecutar `npx supabase test db`.
7. Ejecutar `npm run typecheck`, `npm run lint` y `npm run build`.
8. Documentar el cambio en `DATABASE.md` y `SECURITY.md`.

## Categorías

La navegación pública de la Fase 1 usa 7 categorías estáticas. La base de datos tiene 8 categorías editoriales. **No cambiar la navegación pública** hasta la Fase 3, cuando el portal consuma Supabase como única fuente de verdad.

Para modificar categorías de la base:

1. Agregar una migración con el cambio.
2. Actualizar el seed solo si es una categoría inicial nueva.
3. Actualizar pruebas y tipos.
4. No borrar categorías con notas asociadas: la FK usa `on delete restrict`.

## Despliegue

El proyecto es una SPA con `BrowserRouter`. El hosting debe redirigir rutas desconocidas a `index.html` para que funcionen enlaces como `/noticias` al recargar.

Configuración recomendada para Vercel:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Antes de producción:

1. Crear el proyecto remoto y aplicar las migraciones con `npx supabase db push`.
2. Configurar `VITE_SUPABASE_URL` y la clave pública en el hosting.
3. Desactivar el registro público en Auth.
4. Configurar SMTP propio y las Redirect URLs del dominio.
5. Crear las cuentas editoriales y promover al menos un admin.
6. Ejecutar las pruebas RLS contra staging.
7. Revisar que ninguna clave privada esté en el bundle (`grep` del build o DevTools).
8. Configurar CSP, HSTS, `nosniff`, `Referrer-Policy` y `Permissions-Policy`.
9. Ejecutar `npm run build` y probar todas las rutas.
10. Activar indexación solo con contenido real y revisado.

## Verificación antes de cerrar una fase

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `npx supabase test db`
- [ ] Rutas directas y navegación interna.
- [ ] Login, logout, sesión persistente y recuperación de contraseña.
- [ ] Estado sin Supabase configurado.
- [ ] Móvil, teclado y `Escape` en menús.
- [ ] Sin datos ficticios ni secretos en el repositorio.
- [ ] Documentación actualizada.

## Solución de problemas

| Problema | Causa probable | Solución |
| --- | --- | --- |
| `supabase start` falla | Docker Desktop apagado o puertos ocupados. | Iniciar Docker y revisar puertos `54321`–`54324`. |
| `/admin` pide configurar Supabase | Faltan variables o Vite no se reinició. | Crear `.env`, copiar URL/anon key y reiniciar Vite. |
| Login responde "Correo o contraseña incorrectos" | Credenciales inválidas o usuario no creado. | Crear la cuenta en Studio y verificar la contraseña. |
| No llega el correo de recuperación | SMTP local no revisado o Redirect URL no permitida. | Abrir Mailpit en `54324` y revisar `additional_redirect_urls`. |
| Enlace de recuperación inválido | Enlace vencido, ya usado o sin sesión. | Solicitar uno nuevo. |
| Error RLS `42501` | Política o permiso de columna faltante. | Revisar la política, el rol y la migración; no deshabilitar RLS. |
| `supabase test db` falla | Migraciones sin aplicar o entorno no limpio. | Ejecutar `npx supabase db reset` y repetir. |
| 404 al recargar una ruta | Falta fallback SPA en hosting. | Configurar rewrite a `index.html`. |
| Variables no disponibles | No se reinició Vite o faltan en `.env`. | Reiniciar el servidor y revisar `.env`. |
| Error de Node al instalar | Versión antigua. | Usar Node 22.12+. |
| Estilos faltantes | Clase dinámica no detectada. | Usar clases completas o tokens. |
| Tipos desactualizados | Migración sin actualizar `database.ts`. | Sincronizar tipos y servicios; ejecutar `typecheck`. |
