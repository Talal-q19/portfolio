import { proxyApi } from '@/utils/api-proxy.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = request => proxyApi(request);
export const POST = request => proxyApi(request);
export const PATCH = request => proxyApi(request);
export const DELETE = request => proxyApi(request);
export const HEAD = request => proxyApi(request);
