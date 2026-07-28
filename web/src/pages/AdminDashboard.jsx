import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Dashboard Admin</h1>
        <div>
          <span>{user.nama} ({user.role})</span>
          <button onClick={logout} style={{ marginLeft: 12 }}>Logout</button>
        </div>
      </header>
      <p>Kelola user, kelola survey, dan lihat laporan akan tersedia di sini.</p>
    </div>
  );
}
