import Header from '@/components/dashboard/layout/Header';
import MainArea from '@/components/dashboard/layout/MainArea';
import { Sidebar } from '@/components/dashboard/layout/Sidebar';
import { AuthProvider } from '@/providers/AuthProvider';
import { SidebarProvider } from '@/providers/SidebarProvider';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <div className="relative mx-auto flex w-full max-w-[1680px] border-r max-[1680px]:border-r-0">
          <Sidebar />
          <div className="max-w-full flex-1 bg-background">
            <MainArea>
              <Header />
              <div className="p-10 max-md:p-6">{children}</div>
            </MainArea>
          </div>
        </div>
      </SidebarProvider>
    </AuthProvider>
  );
}
