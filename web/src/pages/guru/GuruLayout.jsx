import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function GuruLayout() {
  const { user, logout } = useAuth();

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 24px',
          borderBottom: '1px solid #ddd',
        }}
      >
        <strong>Survey Siswa — Guru</strong>
        <div>
          <span>{user.nama} ({user.role})</span>
          <button onClick={logout} style={{ marginLeft: 12 }}>Logout</button>
        </div>
      </header>
      <main style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
