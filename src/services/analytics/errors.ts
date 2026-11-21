export class AnalyticsServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AnalyticsServiceError'
  }
}
