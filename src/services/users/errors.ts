export class UsersServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UsersServiceError'
  }
}
