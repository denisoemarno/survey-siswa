import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listSurveys } from '../../api/surveys';
import { errorMessage } from '../../api/errors';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StatusBadge } from '@/components/StatusBadge';

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

  if (loading) return <p className="text-muted-foreground">Memuat...</p>;
  if (error) return (
    <Alert variant="destructive">
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Evaluasi Untuk Anda</h1>
      {surveys.length === 0 && <p className="text-muted-foreground">Belum ada survey evaluasi yang dibuat untuk anda.</p>}
      <div className="flex flex-col gap-3">
        {surveys.map((s) => (
          <Card key={s.id}>
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <div className="font-medium">{s.judul}</div>
                <div className="mt-1"><StatusBadge status={s.status} /></div>
              </div>
              <Link to={`/guru/evaluations/${s.id}`} className={buttonVariants({ size: 'sm' })}>
                Lihat Laporan
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
