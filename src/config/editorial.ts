export interface EditorialPrinciple {
  readonly key: 'verification' | 'context' | 'corrections' | 'independence'
  readonly title: string
  readonly description: string
}

export const editorialPrinciples: readonly EditorialPrinciple[] = [
  {
    key: 'verification',
    title: 'Verificación antes que velocidad',
    description:
      'Cada dato relevante se contrasta con fuentes identificables. La urgencia no justifica publicar información sin confirmar.',
  },
  {
    key: 'context',
    title: 'Contexto local',
    description:
      'Explicamos cómo los hechos afectan a Metapán, Santa Ana y El Salvador, sin perder de vista a las personas.',
  },
  {
    key: 'corrections',
    title: 'Corrección transparente',
    description:
      'Cuando nos equivocamos, corregimos de forma visible y explicamos qué cambió y por qué.',
  },
  {
    key: 'independence',
    title: 'Independencia editorial',
    description:
      'La información y la opinión se mantienen separadas. Ningún interés comercial o político define la cobertura.',
  },
]
