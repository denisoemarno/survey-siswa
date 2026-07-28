import { Badge } from '@/components/ui/badge';

const ROLE_STYLE = {
  admin: 'bg-violet-600 text-white hover:bg-violet-600/90',
  guru: 'bg-blue-600 text-white hover:bg-blue-600/90',
  siswa: 'bg-amber-500 text-white hover:bg-amber-500/90',
};

export function RoleBadge({ role }) {
  return <Badge className={ROLE_STYLE[role] || ''}>{role}</Badge>;
}
