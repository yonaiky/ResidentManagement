import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-blue-100 text-blue-800 dark:bg-gradient-to-r dark:from-blue-500 dark:to-purple-600 dark:text-white dark:shadow-lg',
        secondary:
          'border-transparent bg-gray-100 text-gray-800 dark:bg-gradient-to-r dark:from-slate-500 dark:to-slate-600 dark:text-white dark:shadow-lg',
        destructive:
          'border-transparent bg-red-100 text-red-800 dark:bg-gradient-to-r dark:from-red-500 dark:to-pink-600 dark:text-white dark:shadow-lg',
        outline: 'border border-gray-300 text-gray-700 bg-transparent dark:border-2 dark:border-slate-700 dark:text-slate-300',
        success: 'border-transparent bg-green-100 text-green-800 dark:bg-gradient-to-r dark:from-emerald-500 dark:to-teal-600 dark:text-white dark:shadow-lg',
        warning: 'border-transparent bg-amber-100 text-amber-800 dark:bg-gradient-to-r dark:from-amber-500 dark:to-orange-600 dark:text-white dark:shadow-lg',
        info: 'border-transparent bg-cyan-100 text-cyan-800 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-blue-600 dark:text-white dark:shadow-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
