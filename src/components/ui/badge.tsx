import { cn } from '@/lib/utils/tailwind-helpers';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import * as React from 'react';

// Add type for status variants
type StatusVariant = 'success' | 'error' | 'warning';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2 py-0 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        success:
          'border-transparent bg-[#d7f7c2] dark:bg-green-500/20 text-[#237f26] dark:text-green-400',
        error:
          'border-transparent bg-red-500/10 dark:bg-red-500/20 text-red-500 dark:text-red-400',
        warning:
          'border-transparent bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  showIcon?: boolean;
}

function Badge({ className, variant, showIcon = false, ...props }: BadgeProps) {
  const isStatusVariant = (v: string | null | undefined): v is StatusVariant =>
    v !== null &&
    v !== undefined &&
    ['success', 'error', 'warning'].includes(v);

  const icon =
    showIcon &&
    isStatusVariant(variant) &&
    {
      success: <CheckCircle2 className="mr-1 h-3 w-3" />,
      error: <XCircle className="mr-1 h-3 w-3" />,
      warning: <AlertTriangle className="mr-1 h-3 w-3" />,
    }[variant];

  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {icon}
      {props.children}
    </div>
  );
}

export { Badge, badgeVariants };
