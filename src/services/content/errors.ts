export class ContentServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ContentServiceError'
  }
}

export function contentQueryError(fallback: string): ContentServiceError {
  return new ContentServiceError(fallback)
}
