import { Outlet } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';

const NAV_ITEMS = [
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/surveys', label: 'Surveys' },
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-muted/30">
      <AppHeader title="Survey Siswa — Admin" navItems={NAV_ITEMS} />
      <main className="mx-auto max-w-5xl p-6">
        <Outlet />
      </main>
    </div>
  );
}
