import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listSurveys } from '../../api/surveys';
import { errorMessage } from '../../api/errors';

const statusColor = { draft: '#999', published: '#2a7', closed: '#a33' };

export default function EvaluationsListPage() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    listSurveys()
      .then(setSurveys)
      .catch((err) => setError(errorMessage(err, 'Gagal memuat daftar evaluasi')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Memuat...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h1>Evaluasi Untuk Anda</h1>
      {surveys.length === 0 && <p>Belum ada survey evaluasi yang dibuat untuk anda.</p>}
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
              <div style={{ fontSize: 13 }}>
                Status: <span style={{ color: statusColor[s.status], fontWeight: 'bold' }}>{s.status}</span>
              </div>
            </div>
            <Link to={`/guru/evaluations/${s.id}`}>Lihat Laporan</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
