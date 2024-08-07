'use client';
import { VariantProps } from 'class-variance-authority';
import { Button, buttonVariants } from '../ui/button';
import { LoadingSpinner } from './LoadingSpinner';

interface SubmitButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  pending?: boolean;
  variant?: VariantProps<typeof buttonVariants>['variant'];
}

export default function SubmitButton({
  label,
  pending = false,
  variant = 'default',
  disabled = false,
  ...props
}: SubmitButtonProps) {
  return (
    <Button
      className="w-full"
      disabled={pending || disabled}
      type="submit"
      variant={variant}
      {...props}
    >
      {pending ? <LoadingSpinner /> : label}
    </Button>
  );
}
