# Invitaciones de editores

El formulario del CMS invoca la Edge Function `admin-invite-editor`. Despliega la función en el proyecto Supabase antes de usar esa acción:

```sh
npx supabase functions deploy admin-invite-editor
```

La función valida la sesión y el rol `admin` antes de invitar. Usa los secretos administrados por Supabase (`SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`); la clave de servicio permanece en el backend y nunca se incluye en React. El trigger existente crea el perfil con rol `editor`. Después, un administrador puede cambiar el rol desde el CMS.
