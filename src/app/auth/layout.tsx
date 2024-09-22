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
      <div className="my-5 w-full">{children}</div>
    </div>
  );
}
