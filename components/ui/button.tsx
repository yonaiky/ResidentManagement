import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transform hover:scale-[1.02] active:scale-[0.98] dark:hover:scale-105 dark:active:scale-95',
  {
    variants: {
      variant: {
        default: 'bg-blue-600 text-white shadow-sm hover:shadow-md hover:bg-blue-700 dark:bg-gradient-to-r dark:from-blue-600 dark:to-purple-600 dark:shadow-lg dark:hover:shadow-xl dark:hover:from-blue-700 dark:hover:to-purple-700',
        destructive:
          'bg-red-600 text-white shadow-sm hover:shadow-md hover:bg-red-700 dark:bg-gradient-to-r dark:from-red-500 dark:to-pink-500 dark:shadow-lg dark:hover:shadow-xl dark:hover:from-red-600 dark:hover:to-pink-600',
        outline:
          'border border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400 shadow-sm hover:shadow-md dark:border-2 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:hover:border-slate-600',
        secondary:
          'bg-gray-600 text-white shadow-sm hover:shadow-md hover:bg-gray-700 dark:bg-gradient-to-r dark:from-slate-500 dark:to-slate-600 dark:shadow-lg dark:hover:shadow-xl dark:hover:from-slate-600 dark:hover:to-slate-700',
        ghost: 'hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-slate-800 dark:hover:text-slate-100',
        link: 'text-blue-600 underline-offset-4 hover:underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300',
        success: 'bg-green-600 text-white shadow-sm hover:shadow-md hover:bg-green-700 dark:bg-gradient-to-r dark:from-emerald-500 dark:to-teal-500 dark:shadow-lg dark:hover:shadow-xl dark:hover:from-emerald-600 dark:hover:to-teal-600',
        warning: 'bg-amber-600 text-white shadow-sm hover:shadow-md hover:bg-amber-700 dark:bg-gradient-to-r dark:from-amber-500 dark:to-orange-500 dark:shadow-lg dark:hover:shadow-xl dark:hover:from-amber-600 dark:hover:to-orange-600',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 py-1.5 text-xs',
        lg: 'h-12 rounded-lg px-8 py-3 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
