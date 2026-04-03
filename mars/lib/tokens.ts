/**
 * Rough token estimator for client/server shared use.
 * Rule of thumb: ~4 characters per token.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}
