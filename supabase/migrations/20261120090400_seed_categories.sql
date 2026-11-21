-- =============================================================================
-- Prensa Metapán — Fase 2
-- Categorías editoriales iniciales.
--
-- La inserción es idempotente por slug para poder reaplicar el seed sin
-- duplicados en entornos de prueba.
-- =============================================================================

insert into public.categories (name, slug, description)
values
  (
    'Metapán',
    'metapan',
    'Gobierno local, comunidad, servicios y vida cotidiana en Metapán.'
  ),
  (
    'Santa Ana',
    'santa-ana',
    'El acontecer del departamento de Santa Ana y sus municipios.'
  ),
  (
    'Nacionales',
    'nacionales',
    'Política, economía y sociedad de El Salvador.'
  ),
  (
    'Internacionales',
    'internacionales',
    'Acontecimientos del mundo con impacto en El Salvador.'
  ),
  (
    'Deportes',
    'deportes',
    'Deporte local, departamental y nacional.'
  ),
  (
    'Entretenimiento',
    'entretenimiento',
    'Cine, música, espectáculos y vida cultural.'
  ),
  (
    'Economía',
    'economia',
    'Empresas, empleo, precios y finanzas.'
  ),
  (
    'Tecnología',
    'tecnologia',
    'Innovación, Internet y servicios digitales.'
  )
on conflict (slug) do nothing;
