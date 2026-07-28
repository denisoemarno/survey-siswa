import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listSurveys } from '../../api/surveys';
import { errorMessage } from '../../api/errors';

export default function SurveyListPage() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    listSurveys()
      .then(setSurveys)
      .catch((err) => setError(errorMessage(err, 'Gagal memuat daftar survey')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Memuat...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h1>Survey Untuk Anda</h1>
      {surveys.length === 0 && <p>Belum ada survey yang perlu diisi saat ini.</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {surveys.map((s) => (
          <li
            key={s.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: 6,
              padding: 16,
              marginBottom: 12,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 'bold' }}>{s.judul}</div>
              <div style={{ fontSize: 13, color: '#777' }}>
                Batas waktu: {new Date(s.periode_selesai).toLocaleDateString()}
              </div>
            </div>
            {s.submitted ? (
              <span style={{ color: '#2a7' }}>Sudah diisi</span>
            ) : (
              <Link to={`/siswa/surveys/${s.id}`}>Isi Survey</Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
