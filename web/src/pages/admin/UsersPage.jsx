import { useEffect, useState } from 'react';
import { listUsers, createUser, updateUser, deleteUser, importUsersCsv } from '../../api/users';
import { errorMessage } from '../../api/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RoleBadge } from '@/components/RoleBadge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Kelola User</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCsvOpen((v) => !v)}>
            {csvOpen ? 'Tutup Import CSV' : 'Import CSV'}
          </Button>
          <Button onClick={openCreateForm}>+ Tambah User</Button>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Role</Label>
            <Select value={filters.role || 'all'} onValueChange={(v) => setFilters({ ...filters, role: v === 'all' ? '' : v })}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Semua" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Kelas</Label>
            <Input className="w-36" value={filters.kelas} onChange={(e) => setFilters({ ...filters, kelas: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Angkatan</Label>
            <Input className="w-28" value={filters.angkatan} onChange={(e) => setFilters({ ...filters, angkatan: e.target.value })} />
          </div>
          <Button variant="secondary" onClick={load}>Filter</Button>
        </CardContent>
      </Card>

      {csvOpen && (
        <Card>
          <CardHeader>
            <CardTitle>Import User via CSV</CardTitle>
            <CardDescription>
              Format kolom: <code>nama,email,password,role,kelas,angkatan,mapel_diampu</code>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleImport} className="flex flex-col gap-3">
              <Textarea
                rows={6}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={'nama,email,password,role,kelas,angkatan\nBudi,budi@sekolah.test,rahasia123,siswa,10 IPA 1,2026'}
              />
              {csvError && (
                <Alert variant="destructive">
                  <AlertDescription>{csvError}</AlertDescription>
                </Alert>
              )}
              {csvResult && (
                <Alert>
                  <AlertDescription>
                    Berhasil: {csvResult.created.length}, Gagal: {csvResult.failed.length}
                    {csvResult.failed.length > 0 && (
                      <ul className="mt-2 list-disc pl-5">
                        {csvResult.failed.map((f) => (
                          <li key={f.row}>Baris {f.row} ({f.email}): {f.message}</li>
                        ))}
                      </ul>
                    )}
                  </AlertDescription>
                </Alert>
              )}
              <Button type="submit" disabled={csvSaving || !csvText} className="self-start">
                {csvSaving ? 'Mengimpor...' : 'Import'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {formOpen && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit User' : 'Tambah User'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Nama</Label>
                  <Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Password {editingId && <span className="font-normal text-muted-foreground">(kosongkan jika tidak diubah)</span>}</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editingId} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Role</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Kelas</Label>
                  <Input value={form.kelas} onChange={(e) => setForm({ ...form, kelas: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Angkatan</Label>
                  <Input value={form.angkatan} onChange={(e) => setForm({ ...form, angkatan: e.target.value })} />
                </div>
                <div className="col-span-2 flex flex-col gap-1.5">
                  <Label>Mapel Diampu (guru)</Label>
                  <Input value={form.mapel_diampu} onChange={(e) => setForm({ ...form, mapel_diampu: e.target.value })} />
                </div>
              </div>
              {formError && (
                <Alert variant="destructive">
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</Button>
                <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading && <p className="text-muted-foreground">Memuat...</p>}
      {listError && (
        <Alert variant="destructive">
          <AlertDescription>{listError}</AlertDescription>
        </Alert>
      )}

      {!loading && !listError && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Angkatan</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nama}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <RoleBadge role={u.role} />
                  </TableCell>
                  <TableCell>{u.kelas || '-'}</TableCell>
                  <TableCell>{u.angkatan || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEditForm(u)}>Edit</Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(u)}>Hapus</Button>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">Belum ada user.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
