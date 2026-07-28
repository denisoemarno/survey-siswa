import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const BAR = '#2a78d6';

function Bar({ label, count, percentage, sublabel }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {count} {sublabel} ({percentage}%)
        </span>
      </div>
      <div className="mt-1 h-2.5 rounded-full bg-muted">
        <div
          title={`${count} (${percentage}%)`}
          className="h-full rounded-full"
          style={{ width: `${Math.max(percentage, count > 0 ? 2 : 0)}%`, background: BAR }}
        />
      </div>
    </div>
  );
}

function QuestionReport({ question }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{question.teks_pertanyaan}</CardTitle>
        <p className="text-xs text-muted-foreground">
          {question.tipe_jawaban} &middot; {question.jumlah_dijawab} jawaban
        </p>
      </CardHeader>
      <CardContent>
        {question.tipe_jawaban === 'pilihan_ganda' && question.distribusi.map((d) => (
          <Bar key={d.opsi} label={d.opsi} count={d.count} percentage={d.persentase} sublabel="jawaban" />
        ))}

        {question.tipe_jawaban === 'skala' && (
          <>
            <p className="mb-2 text-sm text-muted-foreground">
              Rata-rata: <strong className="text-foreground">{question.rata_rata ?? '-'}</strong> / 5
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
            <p className="text-sm text-muted-foreground">Belum ada jawaban.</p>
          ) : (
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {question.jawaban.map((text, i) => (
                <li key={i}>{text}</li>
              ))}
            </ul>
          )
        )}
      </CardContent>
    </Card>
  );
}

function StatTile({ label, value }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

export default function ReportView({ report }) {
  if (report.message) {
    return <p className="text-muted-foreground">{report.message}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Laporan: {report.survey.judul}</h1>

      <Card>
        <CardContent className="flex gap-8 pt-6">
          <StatTile label="Total Responden" value={report.participation.total_responses} />
          <StatTile label="Target" value={report.participation.total_target} />
          <StatTile label="Tingkat Partisipasi" value={report.participation.rate !== null ? `${report.participation.rate}%` : '-'} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Per Pertanyaan</h2>
        {report.questions.map((q) => (
          <QuestionReport key={q.id} question={q} />
        ))}
      </div>
    </div>
  );
}
