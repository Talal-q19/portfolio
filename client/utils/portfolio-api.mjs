export async function fetchPortfolio({ signal, fetchImpl = globalThis.fetch } = {}) {
  const timeout = AbortSignal.timeout(12000);
  const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
  requestSignal.throwIfAborted();
  const response = await fetchImpl('/api/content', {
    method: 'GET', cache: 'no-store', credentials: 'same-origin', signal: requestSignal,
  });
  if (!response.ok) throw new Error('Portfolio content is temporarily unavailable.');
  const envelope = await response.json();
  if (!Array.isArray(envelope?.categories)) throw new Error('Portfolio content is temporarily unavailable.');
  return envelope;
}
