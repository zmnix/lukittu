'use client';
import { ConfettiContext } from '@/providers/ThemeProvider';
import { useContext } from 'react';
import { Button } from '../ui/button';
import { LoadingSpinner } from './LoadingSpinner';

interface ConfettiButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function ConfettiButton({
  className,
  children,
}: ConfettiButtonProps) {
  const ctx = useContext(ConfettiContext);
  return (
    <>
      <Button
        className={className}
        disabled={ctx.isConfettiActive}
        size="icon"
        variant="default"
        onClick={() => {
          ctx.setIsConfettiActive(true);

          setTimeout(() => {
            ctx.setIsConfettiActive(false);
          }, 1500);
        }}
      >
        {ctx.isConfettiActive ? <LoadingSpinner size={24} /> : children}
      </Button>
    </>
  );
}
