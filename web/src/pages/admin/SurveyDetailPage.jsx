import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  getSurvey,
  updateSurvey,
  deleteSurvey,
  publishSurvey,
  closeSurvey,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '../../api/surveys';
import { errorMessage } from '../../api/errors';

const QUESTION_TYPES = ['pilihan_ganda', 'skala', 'essay'];

const emptyQuestionForm = { teks_pertanyaan: '', tipe_jawaban: 'pilihan_ganda', opsi: '', wajib: true };

function toDatetimeLocal(iso) {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 16);
}

export default function SurveyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [survey, setSurvey] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);

  const [editForm, setEditForm] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  const [questionFormOpen, setQuestionFormOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [questionForm, setQuestionForm] = useState(emptyQuestionForm);
  const [questionSaving, setQuestionSaving] = useState(false);
  const [questionError, setQuestionError] = useState(null);

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getSurvey(id);
      setSurvey(data.survey);
      setQuestions(data.questions);
    } catch (err) {
      setLoadError(errorMessage(err, 'Gagal memuat survey'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function startEdit() {
    setEditForm({
      judul: survey.judul,
      deskripsi: survey.deskripsi || '',
      target_kelas: survey.target_kelas || '',
      target_angkatan: survey.target_angkatan || '',
      periode_mulai: toDatetimeLocal(survey.periode_mulai),
      periode_selesai: toDatetimeLocal(survey.periode_selesai),
    });
    setActionError(null);
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setEditSaving(true);
    setActionError(null);
    try {
      await updateSurvey(id, {
        judul: editForm.judul,
        deskripsi: editForm.deskripsi || null,
        target_kelas: editForm.target_kelas || null,
        target_angkatan: editForm.target_angkatan ? Number(editForm.target_angkatan) : null,
        periode_mulai: new Date(editForm.periode_mulai).toISOString(),
        periode_selesai: new Date(editForm.periode_selesai).toISOString(),
      });
      setEditForm(null);
      await load();
    } catch (err) {
      setActionError(errorMessage(err, 'Gagal menyimpan perubahan'));
    } finally {
      setEditSaving(false);
    }
  }

  async function handlePublish() {
    setActionError(null);
    try {
      await publishSurvey(id);
      await load();
    } catch (err) {
      setActionError(errorMessage(err, 'Gagal publish survey'));
    }
  }

  async function handleClose() {
    setActionError(null);
    try {
      await closeSurvey(id);
      await load();
    } catch (err) {
      setActionError(errorMessage(err, 'Gagal menutup survey'));
    }
  }

  async function handleDeleteSurvey() {
    if (!window.confirm('Hapus survey ini beserta seluruh pertanyaannya?')) return;
    try {
      await deleteSurvey(id);
      navigate('/admin/surveys');
    } catch (err) {
      setActionError(errorMessage(err, 'Gagal menghapus survey'));
    }
  }

  function openAddQuestion() {
    setEditingQuestionId(null);
    setQuestionForm(emptyQuestionForm);
    setQuestionError(null);
    setQuestionFormOpen(true);
  }

  function openEditQuestion(q) {
    setEditingQuestionId(q.id);
    setQuestionForm({
      teks_pertanyaan: q.teks_pertanyaan,
      tipe_jawaban: q.tipe_jawaban,
      opsi: Array.isArray(q.opsi) ? q.opsi.join(', ') : '',
      wajib: q.wajib,
    });
    setQuestionError(null);
    setQuestionFormOpen(true);
  }

  async function handleQuestionSubmit(e) {
    e.preventDefault();
    setQuestionSaving(true);
    setQuestionError(null);
    try {
      const payload = {
        teks_pertanyaan: questionForm.teks_pertanyaan,
        tipe_jawaban: questionForm.tipe_jawaban,
        wajib: questionForm.wajib,
      };
      if (questionForm.tipe_jawaban === 'pilihan_ganda') {
        payload.opsi = questionForm.opsi.split(',').map((o) => o.trim()).filter(Boolean);
      }

      if (editingQuestionId) {
        await updateQuestion(editingQuestionId, payload);
      } else {
        await createQuestion(id, payload);
      }
      setQuestionFormOpen(false);
      await load();
    } catch (err) {
      setQuestionError(errorMessage(err, 'Gagal menyimpan pertanyaan'));
    } finally {
      setQuestionSaving(false);
    }
  }

  async function handleDeleteQuestion(q) {
    if (!window.confirm('Hapus pertanyaan ini?')) return;
    try {
      await deleteQuestion(q.id);
      await load();
    } catch (err) {
      setActionError(errorMessage(err, 'Gagal menghapus pertanyaan'));
    }
  }

  if (loading) return <p>Memuat...</p>;
  if (loadError) return <p style={{ color: 'red' }}>{loadError}</p>;

  const isDraft = survey.status === 'draft';

  return (
    <div>
      <p><Link to="/admin/surveys">&larr; Kembali ke daftar survey</Link></p>
      <h1>{survey.judul}</h1>
      <p>
        Tipe: <strong>{survey.tipe}</strong> &nbsp;|&nbsp; Status: <strong>{survey.status}</strong>
      </p>
      <p>
        Periode: {new Date(survey.periode_mulai).toLocaleString()} - {new Date(survey.periode_selesai).toLocaleString()}
      </p>

      {actionError && <p style={{ color: 'red' }}>{actionError}</p>}

      <section style={{ marginBottom: 16 }}>
        {isDraft && !editForm && <button onClick={startEdit}>Edit Survey</button>}
        {isDraft && <button onClick={handlePublish} style={{ marginLeft: 8 }}>Publish</button>}
        {survey.status === 'published' && <button onClick={handleClose}>Tutup Survey</button>}
        {isDraft && <button onClick={handleDeleteSurvey} style={{ marginLeft: 8 }}>Hapus Survey</button>}
        <Link to={`/admin/surveys/${id}/report`} style={{ marginLeft: 8 }}>Lihat Laporan</Link>
      </section>

      {editForm && (
        <form onSubmit={handleEditSubmit} style={{ border: '1px solid #ddd', padding: 12, marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>Edit Survey</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <label>
              Judul
              <input value={editForm.judul} onChange={(e) => setEditForm({ ...editForm, judul: e.target.value })} required style={{ display: 'block', width: '100%' }} />
            </label>
            <label>
              Target Kelas
              <input value={editForm.target_kelas} onChange={(e) => setEditForm({ ...editForm, target_kelas: e.target.value })} style={{ display: 'block', width: '100%' }} />
            </label>
            <label>
              Target Angkatan
              <input value={editForm.target_angkatan} onChange={(e) => setEditForm({ ...editForm, target_angkatan: e.target.value })} style={{ display: 'block', width: '100%' }} />
            </label>
            <label>
              Periode Mulai
              <input type="datetime-local" value={editForm.periode_mulai} onChange={(e) => setEditForm({ ...editForm, periode_mulai: e.target.value })} required style={{ display: 'block', width: '100%' }} />
            </label>
            <label>
              Periode Selesai
              <input type="datetime-local" value={editForm.periode_selesai} onChange={(e) => setEditForm({ ...editForm, periode_selesai: e.target.value })} required style={{ display: 'block', width: '100%' }} />
            </label>
            <label style={{ gridColumn: '1 / -1' }}>
              Deskripsi
              <textarea value={editForm.deskripsi} onChange={(e) => setEditForm({ ...editForm, deskripsi: e.target.value })} style={{ display: 'block', width: '100%' }} />
            </label>
          </div>
          <div style={{ marginTop: 12 }}>
            <button type="submit" disabled={editSaving}>{editSaving ? 'Menyimpan...' : 'Simpan'}</button>
            <button type="button" onClick={() => setEditForm(null)} style={{ marginLeft: 8 }}>Batal</button>
          </div>
        </form>
      )}

      <h2>Pertanyaan</h2>
      {isDraft && (
        <button onClick={openAddQuestion} style={{ marginBottom: 12 }}>+ Tambah Pertanyaan</button>
      )}
      {!isDraft && <p style={{ color: '#777' }}>Pertanyaan hanya bisa diubah saat survey berstatus draft.</p>}

      {questionFormOpen && (
        <form onSubmit={handleQuestionSubmit} style={{ border: '1px solid #ddd', padding: 12, marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>{editingQuestionId ? 'Edit Pertanyaan' : 'Tambah Pertanyaan'}</h3>
          <label>
            Teks Pertanyaan
            <input value={questionForm.teks_pertanyaan} onChange={(e) => setQuestionForm({ ...questionForm, teks_pertanyaan: e.target.value })} required style={{ display: 'block', width: '100%' }} />
          </label>
          <label style={{ display: 'block', marginTop: 8 }}>
            Tipe Jawaban
            <select value={questionForm.tipe_jawaban} onChange={(e) => setQuestionForm({ ...questionForm, tipe_jawaban: e.target.value })} style={{ display: 'block', width: '100%' }}>
              {QUESTION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          {questionForm.tipe_jawaban === 'pilihan_ganda' && (
            <label style={{ display: 'block', marginTop: 8 }}>
              Opsi (pisahkan dengan koma)
              <input value={questionForm.opsi} onChange={(e) => setQuestionForm({ ...questionForm, opsi: e.target.value })} placeholder="Ya, Tidak" style={{ display: 'block', width: '100%' }} />
            </label>
          )}
          <label style={{ display: 'block', marginTop: 8 }}>
            <input type="checkbox" checked={questionForm.wajib} onChange={(e) => setQuestionForm({ ...questionForm, wajib: e.target.checked })} /> Wajib dijawab
          </label>
          {questionError && <p style={{ color: 'red' }}>{questionError}</p>}
          <div style={{ marginTop: 12 }}>
            <button type="submit" disabled={questionSaving}>{questionSaving ? 'Menyimpan...' : 'Simpan'}</button>
            <button type="button" onClick={() => setQuestionFormOpen(false)} style={{ marginLeft: 8 }}>Batal</button>
          </div>
        </form>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #333' }}>
            <th>#</th>
            <th>Pertanyaan</th>
            <th>Tipe</th>
            <th>Opsi</th>
            <th>Wajib</th>
            {isDraft && <th>Aksi</th>}
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => (
            <tr key={q.id} style={{ borderBottom: '1px solid #eee' }}>
              <td>{q.urutan}</td>
              <td>{q.teks_pertanyaan}</td>
              <td>{q.tipe_jawaban}</td>
              <td>{Array.isArray(q.opsi) ? q.opsi.join(', ') : '-'}</td>
              <td>{q.wajib ? 'Ya' : 'Tidak'}</td>
              {isDraft && (
                <td>
                  <button onClick={() => openEditQuestion(q)}>Edit</button>
                  <button onClick={() => handleDeleteQuestion(q)} style={{ marginLeft: 6 }}>Hapus</button>
                </td>
              )}
            </tr>
          ))}
          {questions.length === 0 && (
            <tr>
              <td colSpan={isDraft ? 6 : 5}>Belum ada pertanyaan.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
