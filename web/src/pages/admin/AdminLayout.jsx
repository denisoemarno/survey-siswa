import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const linkStyle = ({ isActive }) => ({
  textDecoration: 'none',
  color: isActive ? '#111' : '#555',
  fontWeight: isActive ? 'bold' : 'normal',
});

export default function AdminLayout() {
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
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <strong>Survey Siswa — Admin</strong>
          <nav style={{ display: 'flex', gap: 14 }}>
            <NavLink to="/admin/users" style={linkStyle}>Users</NavLink>
            <NavLink to="/admin/surveys" style={linkStyle}>Surveys</NavLink>
          </nav>
        </div>
        <div>
          <span>{user.nama} ({user.role})</span>
          <button onClick={logout} style={{ marginLeft: 12 }}>Logout</button>
        </div>
      </header>
      <main style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
