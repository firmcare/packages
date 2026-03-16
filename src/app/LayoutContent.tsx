'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');
  const isAuthRoute = pathname.startsWith('/auth');
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isAgentRoute = pathname.startsWith('/agent');

  const showPublicShell = !isAdminRoute && !isAuthRoute && !isDashboardRoute && !isAgentRoute;

  return (
    <>
      {showPublicShell && <Header />}
      <main className="flex-grow">{children}</main>
      {showPublicShell && <Footer />}
    </>
  );
}
