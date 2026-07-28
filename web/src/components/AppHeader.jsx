import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function AppHeader({ title, navItems = [], userDetail }) {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between border-b bg-background px-6 py-3">
      <div className="flex items-center gap-6">
        <span className="flex items-center gap-2 font-semibold">
          <span className="size-2.5 rounded-full bg-primary" />
          {title}
        </span>
        {navItems.length > 0 && (
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {user.nama} <span className="text-xs">({userDetail || user.role})</span>
        </span>
        <Button variant="outline" size="sm" onClick={logout}>
          Logout
        </Button>
      </div>
    </header>
  );
}
