import AdminDashboard from './ui/dashboard';

export const metadata = { title: 'Portfolio Admin', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AdminPage({ searchParams }) {
  const params = await searchParams;
  // A query string can never enable the fixture editor in a production build.
  const preview = process.env.NODE_ENV === 'development' && params.preview === '1';
  return <AdminDashboard preview={preview} />;
}
