// The first auth event hydrates identity; clearing then cancels route validation.
export function shouldClearIdentityCache(previous: string | null | undefined, next: string | null) {
  return previous !== undefined && previous !== next;
}