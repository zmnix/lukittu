import verifyEmail from '@/actions/auth/verify-email';
import VerifyEmailCard from '@/widgets/auth/VerifyEmailCard';

interface VerifyEmailProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function VerifyEmail({ searchParams }: VerifyEmailProps) {
  const token = searchParams.token as string;
  const response = await verifyEmail({ token });

  return (
    <VerifyEmailCard isError={response.isError} message={response.message} />
  );
}
