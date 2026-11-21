export class MediaServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MediaServiceError'
  }
}
