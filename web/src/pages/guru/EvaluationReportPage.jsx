import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getReport } from '../../api/reports';
import { errorMessage } from '../../api/errors';
import ReportView from '../../components/ReportView';

export default function EvaluationReportPage() {
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
      <p><Link to="/guru">&larr; Kembali ke daftar evaluasi</Link></p>
      <ReportView report={report} />
    </div>
  );
}
