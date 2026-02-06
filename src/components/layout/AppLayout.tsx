import { ReactNode } from 'react';
import BottomNav from './BottomNav';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background pb-20">
      {title && (
        <header className="sticky top-0 z-40 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-b border-border">
          <div className="px-4 py-4">
            <h1 className="text-xl font-bold text-foreground">{title}</h1>
          </div>
        </header>
      )}
      <main className="px-4 py-4">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
