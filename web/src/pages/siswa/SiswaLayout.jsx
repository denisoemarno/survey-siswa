import { Outlet } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import { useAuth } from '../../context/AuthContext';

export default function SiswaLayout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-muted/30">
      <AppHeader title="Survey Siswa" userDetail={user.kelas || user.role} />
      <main className="mx-auto max-w-2xl p-6">
        <Outlet />
      </main>
    </div>
  );
}
