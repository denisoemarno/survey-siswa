import { useEffect, useState } from 'react';
import { listUsers, createUser, updateUser, deleteUser, importUsersCsv } from '../../api/users';
import { errorMessage } from '../../api/errors';

const ROLES = ['siswa', 'guru', 'admin'];

const emptyForm = { nama: '', email: '', password: '', role: 'siswa', kelas: '', angkatan: '', mapel_diampu: '' };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [filters, setFilters] = useState({ role: '', kelas: '', angkatan: '' });

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [csvOpen, setCsvOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [csvResult, setCsvResult] = useState(null);
  const [csvError, setCsvError] = useState(null);
  const [csvSaving, setCsvSaving] = useState(false);

  async function load() {
    setLoading(true);
    setListError(null);
    try {
      const params = {};
      if (filters.role) params.role = filters.role;
      if (filters.kelas) params.kelas = filters.kelas;
      if (filters.angkatan) params.angkatan = filters.angkatan;
      setUsers(await listUsers(params));
    } catch (err) {
      setListError(errorMessage(err, 'Gagal memuat daftar user'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreateForm() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setFormOpen(true);
  }

  function openEditForm(user) {
    setEditingId(user.id);
    setForm({
      nama: user.nama,
      email: user.email,
      password: '',
      role: user.role,
      kelas: user.kelas || '',
      angkatan: user.angkatan || '',
      mapel_diampu: user.mapel_diampu || '',
    });
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      const payload = {
        nama: form.nama,
        email: form.email,
        role: form.role,
        kelas: form.kelas || null,
        angkatan: form.angkatan ? Number(form.angkatan) : null,
        mapel_diampu: form.mapel_diampu || null,
      };
      if (form.password) payload.password = form.password;

      if (editingId) {
        await updateUser(editingId, payload);
      } else {
        await createUser({ ...payload, password: form.password });
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      setFormError(errorMessage(err, 'Gagal menyimpan user'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user) {
    if (!window.confirm(`Hapus user "${user.nama}"?`)) return;
    try {
      await deleteUser(user.id);
      await load();
    } catch (err) {
      window.alert(errorMessage(err, 'Gagal menghapus user'));
    }
  }

  async function handleImport(e) {
    e.preventDefault();
    setCsvError(null);
    setCsvResult(null);
    setCsvSaving(true);
    try {
      const result = await importUsersCsv(csvText);
      setCsvResult(result);
      await load();
    } catch (err) {
      setCsvError(errorMessage(err, 'Gagal import CSV'));
    } finally {
      setCsvSaving(false);
    }
  }

  return (
    <div>
      <h1>Kelola User</h1>

      <section style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'end' }}>
        <div>
          <label style={{ display: 'block', fontSize: 12 }}>Role</label>
          <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
            <option value="">Semua</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12 }}>Kelas</label>
          <input value={filters.kelas} onChange={(e) => setFilters({ ...filters, kelas: e.target.value })} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12 }}>Angkatan</label>
          <input value={filters.angkatan} onChange={(e) => setFilters({ ...filters, angkatan: e.target.value })} />
        </div>
        <button onClick={load}>Filter</button>
        <div style={{ flex: 1 }} />
        <button onClick={openCreateForm}>+ Tambah User</button>
        <button onClick={() => setCsvOpen((v) => !v)}>{csvOpen ? 'Tutup Import CSV' : 'Import CSV'}</button>
      </section>

      {csvOpen && (
        <form onSubmit={handleImport} style={{ border: '1px solid #ddd', padding: 12, marginBottom: 16 }}>
          <p style={{ marginTop: 0 }}>
            Format kolom: <code>nama,email,password,role,kelas,angkatan,mapel_diampu</code>
          </p>
          <textarea
            rows={6}
            style={{ width: '100%' }}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={'nama,email,password,role,kelas,angkatan\nBudi,budi@sekolah.test,rahasia123,siswa,10 IPA 1,2026'}
          />
          {csvError && <p style={{ color: 'red' }}>{csvError}</p>}
          {csvResult && (
            <p>
              Berhasil: {csvResult.created.length}, Gagal: {csvResult.failed.length}
              {csvResult.failed.length > 0 && (
                <ul>
                  {csvResult.failed.map((f) => (
                    <li key={f.row}>Baris {f.row} ({f.email}): {f.message}</li>
                  ))}
                </ul>
              )}
            </p>
          )}
          <button type="submit" disabled={csvSaving || !csvText}>
            {csvSaving ? 'Mengimpor...' : 'Import'}
          </button>
        </form>
      )}

      {formOpen && (
        <form onSubmit={handleSubmit} style={{ border: '1px solid #ddd', padding: 12, marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit User' : 'Tambah User'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <label>
              Nama
              <input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required style={{ display: 'block', width: '100%' }} />
            </label>
            <label>
              Email
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required style={{ display: 'block', width: '100%' }} />
            </label>
            <label>
              Password {editingId && '(kosongkan jika tidak diubah)'}
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editingId} style={{ display: 'block', width: '100%' }} />
            </label>
            <label>
              Role
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={{ display: 'block', width: '100%' }}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </label>
            <label>
              Kelas
              <input value={form.kelas} onChange={(e) => setForm({ ...form, kelas: e.target.value })} style={{ display: 'block', width: '100%' }} />
            </label>
            <label>
              Angkatan
              <input value={form.angkatan} onChange={(e) => setForm({ ...form, angkatan: e.target.value })} style={{ display: 'block', width: '100%' }} />
            </label>
            <label>
              Mapel Diampu (guru)
              <input value={form.mapel_diampu} onChange={(e) => setForm({ ...form, mapel_diampu: e.target.value })} style={{ display: 'block', width: '100%' }} />
            </label>
          </div>
          {formError && <p style={{ color: 'red' }}>{formError}</p>}
          <div style={{ marginTop: 12 }}>
            <button type="submit" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
            <button type="button" onClick={() => setFormOpen(false)} style={{ marginLeft: 8 }}>Batal</button>
          </div>
        </form>
      )}

      {loading && <p>Memuat...</p>}
      {listError && <p style={{ color: 'red' }}>{listError}</p>}

      {!loading && !listError && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #333' }}>
              <th>Nama</th>
              <th>Email</th>
              <th>Role</th>
              <th>Kelas</th>
              <th>Angkatan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                <td>{u.nama}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.kelas || '-'}</td>
                <td>{u.angkatan || '-'}</td>
                <td>
                  <button onClick={() => openEditForm(u)}>Edit</button>
                  <button onClick={() => handleDelete(u)} style={{ marginLeft: 6 }}>Hapus</button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6}>Belum ada user.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
