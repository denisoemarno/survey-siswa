import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listSurveys, createSurvey } from '../../api/surveys';
import { listUsers } from '../../api/users';
import { errorMessage } from '../../api/errors';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { StatusBadge } from '@/components/StatusBadge';

const TIPE_OPTIONS = ['kepuasan', 'evaluasi_guru', 'evaluasi_kegiatan'];
const STATUS_OPTIONS = ['draft', 'published', 'closed'];

const emptyForm = {
  judul: '',
  tipe: 'kepuasan',
  deskripsi: '',
  target_kelas: '',
  target_angkatan: '',
  guru_id: '',
  periode_mulai: '',
  periode_selesai: '',
};

export default function SurveysPage() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const [guruOptions, setGuruOptions] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setListError(null);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      setSurveys(await listSurveys(params));
    } catch (err) {
      setListError(errorMessage(err, 'Gagal memuat daftar survey'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openCreateForm() {
    setForm(emptyForm);
    setFormError(null);
    setFormOpen(true);
    try {
      setGuruOptions(await listUsers({ role: 'guru' }));
    } catch {
      setGuruOptions([]);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      const payload = {
        judul: form.judul,
        tipe: form.tipe,
        deskripsi: form.deskripsi || null,
        target_kelas: form.target_kelas || null,
        target_angkatan: form.target_angkatan ? Number(form.target_angkatan) : null,
        periode_mulai: new Date(form.periode_mulai).toISOString(),
        periode_selesai: new Date(form.periode_selesai).toISOString(),
      };
      if (form.tipe === 'evaluasi_guru') payload.guru_id = form.guru_id;

      await createSurvey(payload);
      setFormOpen(false);
      await load();
    } catch (err) {
      setFormError(errorMessage(err, 'Gagal membuat survey'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Kelola Survey</h1>
        <Button onClick={openCreateForm}>+ Buat Survey</Button>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Semua" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="secondary" onClick={load}>Filter</Button>
        </CardContent>
      </Card>

      {formOpen && (
        <Card>
          <CardHeader>
            <CardTitle>Buat Survey Baru</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Judul</Label>
                  <Input value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Tipe</Label>
                  <Select value={form.tipe} onValueChange={(v) => setForm({ ...form, tipe: v })}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPE_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {form.tipe === 'evaluasi_guru' && (
                  <div className="flex flex-col gap-1.5">
                    <Label>Guru</Label>
                    <Select value={form.guru_id} onValueChange={(v) => setForm({ ...form, guru_id: v })}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="-- pilih guru --" />
                      </SelectTrigger>
                      <SelectContent>
                        {guruOptions.map((g) => (
                          <SelectItem key={g.id} value={g.id}>{g.nama}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <Label>Target Kelas (opsional)</Label>
                  <Input value={form.target_kelas} onChange={(e) => setForm({ ...form, target_kelas: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Target Angkatan (opsional)</Label>
                  <Input value={form.target_angkatan} onChange={(e) => setForm({ ...form, target_angkatan: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Periode Mulai</Label>
                  <Input type="datetime-local" value={form.periode_mulai} onChange={(e) => setForm({ ...form, periode_mulai: e.target.value })} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Periode Selesai</Label>
                  <Input type="datetime-local" value={form.periode_selesai} onChange={(e) => setForm({ ...form, periode_selesai: e.target.value })} required />
                </div>
                <div className="col-span-2 flex flex-col gap-1.5">
                  <Label>Deskripsi (opsional)</Label>
                  <Textarea value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} />
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
                <TableHead>Judul</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {surveys.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.judul}</TableCell>
                  <TableCell>{s.tipe}</TableCell>
                  <TableCell><StatusBadge status={s.status} /></TableCell>
                  <TableCell>
                    {new Date(s.periode_mulai).toLocaleDateString()} - {new Date(s.periode_selesai).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link to={`/admin/surveys/${s.id}`} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>Kelola</Link>
                    <Link to={`/admin/surveys/${s.id}/report`} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>Laporan</Link>
                  </TableCell>
                </TableRow>
              ))}
              {surveys.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">Belum ada survey.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
