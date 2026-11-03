import { AdminApiError } from './admin-api.mjs';
export async function uploadMedia(api, file, fetchImpl = fetch) {
  const ticket = await api('media/upload-ticket', { method: 'POST', body: { name: file.name, size: file.size, mime: file.type } });
  let response;
  try {
    response = await fetchImpl(ticket.uploadUrl, { method: 'POST', headers: { 'Content-Type': file.type }, body: file, signal: AbortSignal.timeout(120000) });
  } catch { throw new AdminApiError('Upload failed. Check your connection and retry.'); }
  if (!response.ok) throw new AdminApiError('Upload failed. Please retry.', response.status);
  const { storageId } = await response.json();
  return api('media/complete-upload', { method: 'POST', body: { token: ticket.token, storageId } });
}
