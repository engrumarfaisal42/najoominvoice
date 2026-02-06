import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Camera, History, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/customers', icon: Users, label: 'Customers' },
  { path: '/capture', icon: Camera, label: 'Capture' },
  { path: '/history', icon: History, label: 'History' },
];

export default function BottomNav() {
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-bottom z-50">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all touch-target',
                isActive 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs mt-1 font-medium">{label}</span>
            </Link>
          );
        })}
        <button
          onClick={logout}
          className="flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all touch-target text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-6 h-6" />
          <span className="text-xs mt-1 font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
}
