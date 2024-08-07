import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CircleCheck, CircleX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface VerifyEmailCardProps {
  isError: boolean;
  message: string;
}

export default function VerifyEmailCard({
  isError,
  message,
}: VerifyEmailCardProps) {
  const t = useTranslations();
  return (
    <Card className="mx-auto w-full max-w-lg p-6 max-md:max-w-md max-md:px-0">
      <CardHeader className="space-y-2 text-center">
        <div className="flex items-center justify-center">
          {isError ? (
            <CircleX className="text-destructive" size={42} />
          ) : (
            <CircleCheck className="text-primary" size={42} />
          )}
        </div>
        <CardTitle className="text-2xl font-bold">
          {isError
            ? t('auth.verify_email.verification_failed_title')
            : t('auth.verify_email.verification_success_title')}
        </CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full" asChild>
          <Link href="/auth/login">{t('general.back_to_login')}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
