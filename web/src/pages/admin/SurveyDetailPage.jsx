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
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { StatusBadge } from '@/components/StatusBadge';

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
    if (!window.confirm('Publish survey ini? Setelah dipublish, survey tidak bisa diedit lagi dan siswa target bisa langsung mulai mengisi.')) return;
    setActionError(null);
    try {
      await publishSurvey(id);
      await load();
    } catch (err) {
      setActionError(errorMessage(err, 'Gagal publish survey'));
    }
  }

  async function handleClose() {
    if (!window.confirm('Tutup survey ini? Setelah ditutup, siswa tidak bisa mengisi lagi dan status ini tidak bisa dikembalikan ke published.')) return;
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

  if (loading) return <p className="text-muted-foreground">Memuat...</p>;
  if (loadError) return (
    <Alert variant="destructive">
      <AlertDescription>{loadError}</AlertDescription>
    </Alert>
  );

  const isDraft = survey.status === 'draft';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/admin/surveys" className="text-sm text-muted-foreground hover:text-foreground">
          &larr; Kembali ke daftar survey
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{survey.judul}</h1>
          <StatusBadge status={survey.status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Tipe: {survey.tipe} &middot; Periode: {new Date(survey.periode_mulai).toLocaleString()} - {new Date(survey.periode_selesai).toLocaleString()}
        </p>
      </div>

      {actionError && (
        <Alert variant="destructive">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        {isDraft && !editForm && <Button variant="outline" onClick={startEdit}>Edit Survey</Button>}
        {isDraft && <Button onClick={handlePublish}>Publish</Button>}
        {survey.status === 'published' && <Button onClick={handleClose}>Tutup Survey</Button>}
        {isDraft && <Button variant="destructive" onClick={handleDeleteSurvey}>Hapus Survey</Button>}
        <Link to={`/admin/surveys/${id}/report`} className={buttonVariants({ variant: 'secondary' })}>
          Lihat Laporan
        </Link>
      </div>

      {editForm && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Survey</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Judul</Label>
                  <Input value={editForm.judul} onChange={(e) => setEditForm({ ...editForm, judul: e.target.value })} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Target Kelas</Label>
                  <Input value={editForm.target_kelas} onChange={(e) => setEditForm({ ...editForm, target_kelas: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Target Angkatan</Label>
                  <Input value={editForm.target_angkatan} onChange={(e) => setEditForm({ ...editForm, target_angkatan: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Periode Mulai</Label>
                  <Input type="datetime-local" value={editForm.periode_mulai} onChange={(e) => setEditForm({ ...editForm, periode_mulai: e.target.value })} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Periode Selesai</Label>
                  <Input type="datetime-local" value={editForm.periode_selesai} onChange={(e) => setEditForm({ ...editForm, periode_selesai: e.target.value })} required />
                </div>
                <div className="col-span-2 flex flex-col gap-1.5">
                  <Label>Deskripsi</Label>
                  <Textarea value={editForm.deskripsi} onChange={(e) => setEditForm({ ...editForm, deskripsi: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={editSaving}>{editSaving ? 'Menyimpan...' : 'Simpan'}</Button>
                <Button type="button" variant="outline" onClick={() => setEditForm(null)}>Batal</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Pertanyaan</h2>
          {isDraft && <Button size="sm" onClick={openAddQuestion}>+ Tambah Pertanyaan</Button>}
        </div>
        {!isDraft && (
          <p className="mb-3 text-sm text-muted-foreground">Pertanyaan hanya bisa diubah saat survey berstatus draft.</p>
        )}

        {questionFormOpen && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>{editingQuestionId ? 'Edit Pertanyaan' : 'Tambah Pertanyaan'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleQuestionSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Teks Pertanyaan</Label>
                  <Input
                    value={questionForm.teks_pertanyaan}
                    onChange={(e) => setQuestionForm({ ...questionForm, teks_pertanyaan: e.target.value })}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Tipe Jawaban</Label>
                  <Select value={questionForm.tipe_jawaban} onValueChange={(v) => setQuestionForm({ ...questionForm, tipe_jawaban: v })}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QUESTION_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {questionForm.tipe_jawaban === 'pilihan_ganda' && (
                  <div className="flex flex-col gap-1.5">
                    <Label>Opsi (pisahkan dengan koma)</Label>
                    <Input
                      value={questionForm.opsi}
                      onChange={(e) => setQuestionForm({ ...questionForm, opsi: e.target.value })}
                      placeholder="Ya, Tidak"
                    />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="wajib"
                    checked={questionForm.wajib}
                    onCheckedChange={(checked) => setQuestionForm({ ...questionForm, wajib: checked })}
                  />
                  <Label htmlFor="wajib" className="font-normal">Wajib dijawab</Label>
                </div>
                {questionError && (
                  <Alert variant="destructive">
                    <AlertDescription>{questionError}</AlertDescription>
                  </Alert>
                )}
                <div className="flex gap-2">
                  <Button type="submit" disabled={questionSaving}>{questionSaving ? 'Menyimpan...' : 'Simpan'}</Button>
                  <Button type="button" variant="outline" onClick={() => setQuestionFormOpen(false)}>Batal</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Pertanyaan</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Opsi</TableHead>
                <TableHead>Wajib</TableHead>
                {isDraft && <TableHead className="text-right">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((q) => (
                <TableRow key={q.id}>
                  <TableCell>{q.urutan}</TableCell>
                  <TableCell className="font-medium">{q.teks_pertanyaan}</TableCell>
                  <TableCell>{q.tipe_jawaban}</TableCell>
                  <TableCell>{Array.isArray(q.opsi) ? q.opsi.join(', ') : '-'}</TableCell>
                  <TableCell>{q.wajib ? 'Ya' : 'Tidak'}</TableCell>
                  {isDraft && (
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditQuestion(q)}>Edit</Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteQuestion(q)}>Hapus</Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {questions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isDraft ? 6 : 5} className="text-center text-muted-foreground">
                    Belum ada pertanyaan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
