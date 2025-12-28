import { AdminHeader } from '@/components/admin/AdminHeader';

export const metadata = {
  title: 'Setsuna Admin',
  description: 'Admin dashboard for Setsuna',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-900">
      <AdminHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
