import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getReport } from '../../api/reports';
import { errorMessage } from '../../api/errors';

const INK_PRIMARY = '#0b0b0b';
const INK_SECONDARY = '#52514e';
const INK_MUTED = '#898781';
const TRACK = '#e1e0d9';
const BAR = '#2a78d6';

function Bar({ label, count, percentage, sublabel }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: INK_PRIMARY }}>
        <span>{label}</span>
        <span style={{ color: INK_SECONDARY, fontVariantNumeric: 'tabular-nums' }}>
          {count} {sublabel} ({percentage}%)
        </span>
      </div>
      <div style={{ background: TRACK, borderRadius: 4, height: 10, marginTop: 4 }}>
        <div
          title={`${count} (${percentage}%)`}
          style={{
            width: `${Math.max(percentage, count > 0 ? 2 : 0)}%`,
            background: BAR,
            height: '100%',
            borderRadius: 4,
          }}
        />
      </div>
    </div>
  );
}

function QuestionReport({ question }) {
  return (
    <div style={{ border: '1px solid #eee', borderRadius: 6, padding: 12, marginBottom: 12 }}>
      <p style={{ margin: '0 0 8px', fontWeight: 'bold', color: INK_PRIMARY }}>{question.teks_pertanyaan}</p>
      <p style={{ margin: '0 0 8px', fontSize: 12, color: INK_MUTED }}>
        {question.tipe_jawaban} &middot; {question.jumlah_dijawab} jawaban
      </p>

      {question.tipe_jawaban === 'pilihan_ganda' && question.distribusi.map((d) => (
        <Bar key={d.opsi} label={d.opsi} count={d.count} percentage={d.persentase} sublabel="jawaban" />
      ))}

      {question.tipe_jawaban === 'skala' && (
        <>
          <p style={{ margin: '0 0 8px', color: INK_SECONDARY }}>
            Rata-rata: <strong style={{ color: INK_PRIMARY }}>{question.rata_rata ?? '-'}</strong> / 5
          </p>
          {question.distribusi.map((d) => (
            <Bar
              key={d.skala}
              label={`Skala ${d.skala}`}
              count={d.count}
              percentage={question.jumlah_dijawab ? Math.round((d.count / question.jumlah_dijawab) * 1000) / 10 : 0}
              sublabel="jawaban"
            />
          ))}
        </>
      )}

      {question.tipe_jawaban === 'essay' && (
        question.jawaban.length === 0 ? (
          <p style={{ color: INK_MUTED, fontSize: 14 }}>Belum ada jawaban.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {question.jawaban.map((text, i) => (
              <li key={i} style={{ color: INK_SECONDARY, marginBottom: 4 }}>{text}</li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}

export default function SurveyReportPage() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getReport(id)
      .then(setReport)
      .catch((err) => setError(errorMessage(err, 'Gagal memuat laporan')))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Memuat...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <p><Link to={`/admin/surveys/${id}`}>&larr; Kembali ke survey</Link></p>

      {report.message ? (
        <p>{report.message}</p>
      ) : (
        <>
          <h1>Laporan: {report.survey.judul}</h1>

          <div
            style={{
              display: 'flex',
              gap: 24,
              border: '1px solid #eee',
              borderRadius: 6,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: INK_MUTED }}>Total Responden</div>
              <div style={{ fontSize: 28, color: INK_PRIMARY, fontVariantNumeric: 'tabular-nums' }}>
                {report.participation.total_responses}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: INK_MUTED }}>Target</div>
              <div style={{ fontSize: 28, color: INK_PRIMARY, fontVariantNumeric: 'tabular-nums' }}>
                {report.participation.total_target}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: INK_MUTED }}>Tingkat Partisipasi</div>
              <div style={{ fontSize: 28, color: INK_PRIMARY, fontVariantNumeric: 'tabular-nums' }}>
                {report.participation.rate !== null ? `${report.participation.rate}%` : '-'}
              </div>
            </div>
          </div>

          <h2>Per Pertanyaan</h2>
          {report.questions.map((q) => (
            <QuestionReport key={q.id} question={q} />
          ))}
        </>
      )}
    </div>
  );
}
