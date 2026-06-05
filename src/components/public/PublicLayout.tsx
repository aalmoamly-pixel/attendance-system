import type { ReactNode } from 'react';
import PublicNavbar from './PublicNavbar';
import PublicFooter from './PublicFooter';

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      <PublicNavbar />
      <main className="flex-grow pt-24 pb-12">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
