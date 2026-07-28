import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listSurveys } from '../../api/surveys';
import { errorMessage } from '../../api/errors';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

  if (loading) return <p className="text-muted-foreground">Memuat...</p>;
  if (error) return (
    <Alert variant="destructive">
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Survey Untuk Anda</h1>
      {surveys.length === 0 && <p className="text-muted-foreground">Belum ada survey yang perlu diisi saat ini.</p>}
      <div className="flex flex-col gap-3">
        {surveys.map((s) => (
          <Card key={s.id}>
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <div className="font-medium">{s.judul}</div>
                <div className="text-sm text-muted-foreground">
                  Batas waktu: {new Date(s.periode_selesai).toLocaleDateString()}
                </div>
              </div>
              {s.submitted ? (
                <Badge className="bg-green-600 text-white hover:bg-green-600/90">Sudah diisi</Badge>
              ) : (
                <Link to={`/siswa/surveys/${s.id}`} className={buttonVariants({ size: 'sm' })}>
                  Isi Survey
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
