export class TranslatableError extends Error {
  errorData: Record<string, unknown>

  constructor(message: string, errorData: Record<string, unknown> = {}) {
    super(message)
    this.errorData = errorData
    this.name = 'TranslatableError'
  }
}
