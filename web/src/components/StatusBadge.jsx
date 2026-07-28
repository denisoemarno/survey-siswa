import { Badge } from '@/components/ui/badge';

const STATUS_STYLE = {
  draft: { variant: 'outline', className: '' },
  published: { variant: 'default', className: 'bg-green-600 text-white hover:bg-green-600/90' },
  closed: { variant: 'secondary', className: '' },
};

export function StatusBadge({ status }) {
  const style = STATUS_STYLE[status] || { variant: 'outline', className: '' };
  return (
    <Badge variant={style.variant} className={style.className}>
      {status}
    </Badge>
  );
}
