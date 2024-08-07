import ResetPasswordCard from '@/widgets/auth/ResetPasswordCard';

interface ResetPasswordProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ResetPassword({
  searchParams,
}: ResetPasswordProps) {
  const token = searchParams.token as string;

  return <ResetPasswordCard token={token} />;
}
