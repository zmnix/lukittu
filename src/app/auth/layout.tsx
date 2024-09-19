import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/shared/ThemeSwitcher';
import { Card } from '@/components/ui/card';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default async function AuthLayout({ children }: AuthLayoutProps) {
  const sessionId = cookies().get('session')?.value;

  if (sessionId) {
    redirect('/dashboard');
  }

  return (
    <div className="relative flex min-h-dvh w-full items-center justify-center bg-background p-2">
      <div className="mb-28 mt-10 w-full">{children}</div>
      <Card className="absolute right-4 top-1/2 flex -translate-y-1/2 transform flex-col gap-2 rounded-lg p-2 max-md:bottom-0 max-md:right-auto max-md:top-auto max-md:flex-row">
        <ThemeSwitcher />
        <LanguageSwitcher />
      </Card>
    </div>
  );
}
