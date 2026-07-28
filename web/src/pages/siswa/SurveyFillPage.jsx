import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSurvey, getResponseStatus, submitResponse } from '../../api/surveys';
import { errorMessage } from '../../api/errors';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

function QuestionField({ question, value, onChange }) {
  if (question.tipe_jawaban === 'pilihan_ganda') {
    return (
      <RadioGroup value={value || ''} onValueChange={onChange}>
        {(question.opsi || []).map((opsi) => (
          <div key={opsi} className="flex items-center gap-2">
            <RadioGroupItem value={opsi} id={`${question.id}-${opsi}`} />
            <Label htmlFor={`${question.id}-${opsi}`} className="font-normal">{opsi}</Label>
          </div>
        ))}
      </RadioGroup>
    );
  }

  if (question.tipe_jawaban === 'skala') {
    return (
      <RadioGroup value={value ? String(value) : ''} onValueChange={onChange} className="flex flex-row gap-4">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="flex flex-col items-center gap-1">
            <RadioGroupItem value={String(n)} id={`${question.id}-${n}`} />
            <Label htmlFor={`${question.id}-${n}`} className="text-xs font-normal">{n}</Label>
          </div>
        ))}
      </RadioGroup>
    );
  }

  return (
    <Textarea value={value || ''} onChange={(e) => onChange(e.target.value)} rows={3} />
  );
}

export default function SurveyFillPage() {
  const { id } = useParams();

  const [survey, setSurvey] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const [surveyData, status] = await Promise.all([getSurvey(id), getResponseStatus(id)]);
        setSurvey(surveyData.survey);
        setQuestions(surveyData.questions);
        setAlreadySubmitted(status.submitted);
      } catch (err) {
        setLoadError(errorMessage(err, 'Gagal memuat survey'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function setAnswer(questionId, val) {
    setAnswers((prev) => ({ ...prev, [questionId]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError(null);

    const missingWajib = questions.find((q) => q.wajib && !answers[q.id]);
    if (missingWajib) {
      setSubmitError(`Pertanyaan "${missingWajib.teks_pertanyaan}" wajib dijawab`);
      return;
    }

    setSubmitting(true);
    try {
      const payload = Object.entries(answers)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([question_id, jawaban]) => ({ question_id, jawaban }));
      await submitResponse(id, payload);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(errorMessage(err, 'Gagal mengirim jawaban'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-muted-foreground">Memuat...</p>;
  if (loadError) return (
    <Alert variant="destructive">
      <AlertDescription>{loadError}</AlertDescription>
    </Alert>
  );

  if (submitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Terima kasih!</CardTitle>
          <CardDescription>Jawaban anda untuk survey &quot;{survey.judul}&quot; berhasil dikirim.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/siswa" className="text-sm text-primary hover:underline">&larr; Kembali ke daftar survey</Link>
        </CardContent>
      </Card>
    );
  }

  if (alreadySubmitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{survey.judul}</CardTitle>
          <CardDescription>Anda sudah mengisi survey ini sebelumnya.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/siswa" className="text-sm text-primary hover:underline">&larr; Kembali ke daftar survey</Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Link to="/siswa" className="text-sm text-muted-foreground hover:text-foreground">
        &larr; Kembali ke daftar survey
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>{survey.judul}</CardTitle>
          {survey.deskripsi && <CardDescription>{survey.deskripsi}</CardDescription>}
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-xs text-muted-foreground">
            Pertanyaan bertanda <span className="font-bold text-destructive">*</span> wajib diisi.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {questions.map((q, i) => (
              <div key={q.id} className="flex flex-col gap-2">
                <p className="font-semibold">
                  {i + 1}. {q.teks_pertanyaan}
                  {q.wajib && <span className="ml-1 font-bold text-destructive">*</span>}
                </p>
                <QuestionField question={q} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />
              </div>
            ))}

            {submitError && (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" disabled={submitting} className="self-start">
              {submitting ? 'Mengirim...' : 'Kirim Jawaban'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
