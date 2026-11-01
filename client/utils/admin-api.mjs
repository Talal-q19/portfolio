export class AdminApiError extends Error {
  constructor(message, status = 0, fields = {}, attempts) { super(message); this.status = status; this.fields = fields; this.attempts = attempts; }
}

export function createAdminApi(fetchImpl = fetch) {
  let refreshing;
  return async (path, { method = 'GET', body, signal } = {}) => {
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) controller.abort();
    const timer = setTimeout(abort, 15000);
    try {
      const multipart = body instanceof FormData;
      const options = {
        method, credentials: 'same-origin', cache: 'no-store', signal: controller.signal,
        headers: { 'X-Admin-Request': '1', ...(!multipart && body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
        ...(body === undefined ? {} : { body: multipart ? body : JSON.stringify(body),
        }),
      };
      let response = await fetchImpl(`/api/admin/${path}`, options);
      if (response.status === 401 && (!path.startsWith('auth/') || path === 'auth/session')) {
        if (!refreshing) {
          refreshing = fetchImpl('/api/admin/auth/refresh', {
            method: 'POST', credentials: 'same-origin', cache: 'no-store',
            headers: { 'Content-Type': 'application/json', 'X-Admin-Request': '1' }, body: '{}',
            signal: AbortSignal.timeout(10000),
          }).then(result => result.ok).finally(() => { refreshing = undefined; });
        }
        if (await refreshing) response = await fetchImpl(`/api/admin/${path}`, options);
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new AdminApiError(response.status === 401 && !path.startsWith('auth/') ? 'Your session has expired. Sign in again. Your open form has been preserved.' : data.message || 'The request failed. Please retry.', response.status, data.fields, data.attempts);
      return data;
    } catch (error) {
      if (error instanceof AdminApiError) throw error;
      throw new AdminApiError(signal?.aborted ? 'Request cancelled.' : 'Unable to reach the admin API. Check your connection and retry.');
    } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
  };
}

// Convert normalized API media objects back to write references, removing component IDs.
export function payloadForWrite(fields, data, components) {
  return Object.fromEntries(Object.entries(fields).filter(([key]) => data[key] !== undefined).map(([key, spec]) => {
    const value = data[key];
    return [key, spec.type === 'media' ? value?.id || value || null : spec.type === 'list'
      ? (value || []).map(row => payloadForWrite(components[spec.component], row, components))
        : value === '' && ['enum', 'integer', 'date', 'skillGroup'].includes(spec.type) ? null : value];
  }));
}

export async function fetchAdminMedia(api, { signal } = {}) {
  const items = [];
  let page = 1;
  let pageCount;
  do {
    const response = await api(`media?page=${page}&pageSize=100`, { signal });
    items.push(...response.items);
    // The phase-3 CMS returns total/pageSize; fixtures may also include pageCount.
    pageCount = response.pagination.pageCount ?? Math.ceil(response.pagination.total / (response.pagination.pageSize || 100));
    page++;
  } while (page <= pageCount);
  return items;
}

export function emptyFields(fields) {
  return Object.fromEntries(Object.entries(fields).map(([key, spec]) => [key, spec.type === 'list' ? [] : spec.type === 'boolean' ? false : '']));
}

export function moveItem(items, index, delta) {
  const next = [...items];
  if (index + delta < 0 || index + delta >= next.length) return next;
  [next[index], next[index + delta]] = [next[index + delta], next[index]];
  return next;
}
