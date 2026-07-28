import { useAuth } from '../context/AuthContext';

export default function GuruDashboard() {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Dashboard Guru</h1>
        <div>
          <span>{user.nama} ({user.role})</span>
          <button onClick={logout} style={{ marginLeft: 12 }}>Logout</button>
        </div>
      </header>
      <p>Hasil evaluasi untuk anda akan tersedia di sini.</p>
    </div>
  );
}
