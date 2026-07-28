import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listSurveys, createSurvey } from '../../api/surveys';
import { listUsers } from '../../api/users';
import { errorMessage } from '../../api/errors';

const TIPE_OPTIONS = ['kepuasan', 'evaluasi_guru', 'evaluasi_kegiatan'];

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

const statusColor = { draft: '#999', published: '#2a7', closed: '#a33' };

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
    <div>
      <h1>Kelola Survey</h1>

      <section style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'end' }}>
        <div>
          <label style={{ display: 'block', fontSize: 12 }}>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Semua</option>
            <option value="draft">draft</option>
            <option value="published">published</option>
            <option value="closed">closed</option>
          </select>
        </div>
        <button onClick={load}>Filter</button>
        <div style={{ flex: 1 }} />
        <button onClick={openCreateForm}>+ Buat Survey</button>
      </section>

      {formOpen && (
        <form onSubmit={handleSubmit} style={{ border: '1px solid #ddd', padding: 12, marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>Buat Survey Baru</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <label>
              Judul
              <input value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} required style={{ display: 'block', width: '100%' }} />
            </label>
            <label>
              Tipe
              <select value={form.tipe} onChange={(e) => setForm({ ...form, tipe: e.target.value })} style={{ display: 'block', width: '100%' }}>
                {TIPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
            {form.tipe === 'evaluasi_guru' && (
              <label>
                Guru
                <select value={form.guru_id} onChange={(e) => setForm({ ...form, guru_id: e.target.value })} required style={{ display: 'block', width: '100%' }}>
                  <option value="">-- pilih guru --</option>
                  {guruOptions.map((g) => (
                    <option key={g.id} value={g.id}>{g.nama}</option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Target Kelas (opsional)
              <input value={form.target_kelas} onChange={(e) => setForm({ ...form, target_kelas: e.target.value })} style={{ display: 'block', width: '100%' }} />
            </label>
            <label>
              Target Angkatan (opsional)
              <input value={form.target_angkatan} onChange={(e) => setForm({ ...form, target_angkatan: e.target.value })} style={{ display: 'block', width: '100%' }} />
            </label>
            <label>
              Periode Mulai
              <input type="datetime-local" value={form.periode_mulai} onChange={(e) => setForm({ ...form, periode_mulai: e.target.value })} required style={{ display: 'block', width: '100%' }} />
            </label>
            <label>
              Periode Selesai
              <input type="datetime-local" value={form.periode_selesai} onChange={(e) => setForm({ ...form, periode_selesai: e.target.value })} required style={{ display: 'block', width: '100%' }} />
            </label>
            <label style={{ gridColumn: '1 / -1' }}>
              Deskripsi (opsional)
              <textarea value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} style={{ display: 'block', width: '100%' }} />
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
              <th>Judul</th>
              <th>Tipe</th>
              <th>Status</th>
              <th>Periode</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {surveys.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid #eee' }}>
                <td>{s.judul}</td>
                <td>{s.tipe}</td>
                <td>
                  <span style={{ color: statusColor[s.status], fontWeight: 'bold' }}>{s.status}</span>
                </td>
                <td>
                  {new Date(s.periode_mulai).toLocaleDateString()} - {new Date(s.periode_selesai).toLocaleDateString()}
                </td>
                <td>
                  <Link to={`/admin/surveys/${s.id}`}>Kelola</Link>
                  {' | '}
                  <Link to={`/admin/surveys/${s.id}/report`}>Laporan</Link>
                </td>
              </tr>
            ))}
            {surveys.length === 0 && (
              <tr>
                <td colSpan={5}>Belum ada survey.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
