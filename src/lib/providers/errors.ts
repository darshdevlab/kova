export class ProviderError extends Error {
  constructor(public code: string, message: string, public status = 400) { super(message); }
}
export function publicError(error: unknown) {
  return error instanceof ProviderError ? error : new ProviderError("unavailable", "Provider service unavailable. Try again later.", 503);
}
