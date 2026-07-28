import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getReport } from '../../api/reports';
import { errorMessage } from '../../api/errors';
import ReportView from '../../components/ReportView';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

  if (loading) return <p className="text-muted-foreground">Memuat...</p>;
  if (error) return (
    <Alert variant="destructive">
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );

  return (
    <div className="flex flex-col gap-4">
      <Link to={`/admin/surveys/${id}`} className="text-sm text-muted-foreground hover:text-foreground">
        &larr; Kembali ke survey
      </Link>
      <ReportView report={report} />
    </div>
  );
}
