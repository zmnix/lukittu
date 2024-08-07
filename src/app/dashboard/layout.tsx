import Header from '@/components/dashboard/layout/Header';
import MainArea from '@/components/dashboard/layout/MainArea';
import { Sidebar } from '@/components/dashboard/layout/Sidebar';
import { getSession } from '@/lib/utils/auth';
import { SidebarProvider } from '@/providers/SidebarProvider';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = await getSession({ user: { include: { teams: true } } });

  return (
    <SidebarProvider>
      <div className="relative mx-auto flex w-full max-w-full">
        <Sidebar />
        <div className="max-w-full flex-1 bg-background">
          <MainArea>
            <Header session={session} />
            <div className="p-10">{children}</div>
          </MainArea>
        </div>
      </div>
    </SidebarProvider>
  );
}
