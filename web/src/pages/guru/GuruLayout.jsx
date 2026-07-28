import { Outlet } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';

export default function GuruLayout() {
  return (
    <div className="min-h-screen bg-muted/30">
      <AppHeader title="Survey Siswa — Guru" />
      <main className="mx-auto max-w-2xl p-6">
        <Outlet />
      </main>
    </div>
  );
}
