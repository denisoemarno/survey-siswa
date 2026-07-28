import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSurvey, getResponseStatus, submitResponse } from '../../api/surveys';
import { errorMessage } from '../../api/errors';

function QuestionField({ question, value, onChange }) {
  if (question.tipe_jawaban === 'pilihan_ganda') {
    return (
      <div>
        {(question.opsi || []).map((opsi) => (
          <label key={opsi} style={{ display: 'block', marginBottom: 4 }}>
            <input
              type="radio"
              name={question.id}
              value={opsi}
              checked={value === opsi}
              onChange={(e) => onChange(e.target.value)}
            />{' '}
            {opsi}
          </label>
        ))}
      </div>
    );
  }

  if (question.tipe_jawaban === 'skala') {
    return (
      <div style={{ display: 'flex', gap: 12 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} style={{ textAlign: 'center' }}>
            <input
              type="radio"
              name={question.id}
              value={n}
              checked={Number(value) === n}
              onChange={(e) => onChange(e.target.value)}
            />
            <div style={{ fontSize: 12 }}>{n}</div>
          </label>
        ))}
      </div>
    );
  }

  return (
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: '100%' }}
      rows={3}
    />
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

  if (loading) return <p>Memuat...</p>;
  if (loadError) return <p style={{ color: 'red' }}>{loadError}</p>;

  if (submitted) {
    return (
      <div>
        <h1>Terima kasih!</h1>
        <p>Jawaban anda untuk survey &quot;{survey.judul}&quot; berhasil dikirim.</p>
        <Link to="/siswa">&larr; Kembali ke daftar survey</Link>
      </div>
    );
  }

  if (alreadySubmitted) {
    return (
      <div>
        <h1>{survey.judul}</h1>
        <p>Anda sudah mengisi survey ini sebelumnya.</p>
        <Link to="/siswa">&larr; Kembali ke daftar survey</Link>
      </div>
    );
  }

  return (
    <div>
      <p><Link to="/siswa">&larr; Kembali ke daftar survey</Link></p>
      <h1>{survey.judul}</h1>
      {survey.deskripsi && <p>{survey.deskripsi}</p>}

      <form onSubmit={handleSubmit}>
        {questions.map((q, i) => (
          <div key={q.id} style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 6 }}>
              {i + 1}. {q.teks_pertanyaan} {q.wajib && <span style={{ color: 'red' }}>*</span>}
            </label>
            <QuestionField question={q} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />
          </div>
        ))}

        {submitError && <p style={{ color: 'red' }}>{submitError}</p>}
        <button type="submit" disabled={submitting}>{submitting ? 'Mengirim...' : 'Kirim Jawaban'}</button>
      </form>
    </div>
  );
}
