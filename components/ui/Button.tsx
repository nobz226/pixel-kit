'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/design-system/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'glass' | 'glassPrimary';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon' | 'iconSm' | 'iconLg';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      onDrag,
      onDragStart,
      onDragEnd,
      onDragEnter,
      onDragLeave,
      onDragOver,
      onDrop,
      onAnimationStart,
      onAnimationEnd,
      onAnimationIteration,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      'inline-flex items-center justify-center gap-2',
      'font-medium transition-all duration-200 ease-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      'disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
      'active:scale-[0.98]',
      'select-none relative overflow-hidden',
      fullWidth && 'w-full'
    );

    const variantStyles = {
      primary: cn(
        'bg-primary text-primary-foreground',
        'hover:bg-primary/90',
        'shadow-sm shadow-primary/20',
        'hover:shadow-md hover:shadow-primary/30'
      ),
      secondary: cn(
        'bg-secondary text-secondary-foreground',
        'hover:bg-secondary/80',
        'border border-border'
      ),
      outline: cn(
        'border border-border bg-transparent',
        'hover:bg-accent hover:text-accent-foreground',
        'hover:border-primary/50'
      ),
      ghost: cn(
        'bg-transparent',
        'hover:bg-accent hover:text-accent-foreground'
      ),
      destructive: cn(
        'bg-destructive text-destructive-foreground',
        'hover:bg-destructive/90',
        'shadow-sm shadow-destructive/20'
      ),
      glass: cn(
        'bg-white/5 backdrop-blur-xl border border-white/10',
        'hover:bg-white/10',
        'text-white'
      ),
      glassPrimary: cn(
        'bg-primary/10 backdrop-blur-xl border border-primary/30',
        'hover:bg-primary/20',
        'text-primary'
      ),
    };

    const sizeStyles = {
      xs: 'h-7 px-2.5 text-xs gap-1',
      sm: 'h-9 px-3 text-sm gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-11 px-6 text-base gap-2',
      xl: 'h-12 px-8 text-lg gap-2.5',
      icon: 'h-10 w-10',
      iconSm: 'h-8 w-8',
      iconLg: 'h-12 w-12',
    };

    return (
      <motion.button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        disabled={disabled || loading}
        whileHover={!disabled && !loading ? { scale: 1.02 } : undefined}
        whileTap={!disabled && !loading ? { scale: 0.96 } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        style={{ cursor: loading ? 'wait' : undefined }}
        {...props}
      >
        {loading ? (
          <>
            <motion.span
              className="flex h-4 w-4 items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <svg className="h-4 w-4 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </motion.span>
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
        <AnimatePresence mode="wait">
          {!loading && (
            <motion.span
              key="ripple"
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 4, opacity: 0 }}
              exit={{ scale: 4, opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="absolute inset-0 bg-current/20 rounded-inherit pointer-events-none"
            />
          )}
        </AnimatePresence>
      </motion.button>
    );
  }
);
Button.displayName = 'Button';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'glass' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  'aria-label': string;
  children: React.ReactNode;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = 'ghost', size = 'md', 'aria-label': ariaLabel, children, onDrag, onDragStart, onDragEnd, onDragEnter, onDragLeave, onDragOver, onDrop, onAnimationStart, onAnimationEnd, onAnimationIteration, ...props }, ref) => {
    const baseStyles = cn(
      'inline-flex items-center justify-center',
      'transition-all duration-200 ease-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      'disabled:pointer-events-none disabled:opacity-50'
    );

    const variantStyles = {
      default: cn('bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border'),
      ghost: cn('bg-transparent hover:bg-accent hover:text-accent-foreground'),
      glass: cn('bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 text-white'),
      primary: cn('bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20'),
    };

    const sizeStyles = {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
    };

    return (
      <motion.button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], 'rounded-lg', className)}
        aria-label={ariaLabel}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
IconButton.displayName = 'IconButton';

export interface ToggleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  variant?: 'default' | 'glass' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const ToggleButton = React.forwardRef<HTMLButtonElement, ToggleButtonProps>(
  ({ className, pressed, onPressedChange, variant = 'default', size = 'md', children, onDrag, onDragStart, onDragEnd, onDragEnter, onDragLeave, onDragOver, onDrop, onAnimationStart, onAnimationEnd, onAnimationIteration, ...props }, ref) => {
    const handleClick = () => {
      onPressedChange?.(!pressed);
    };

    const baseStyles = cn(
      'inline-flex items-center justify-center gap-2',
      'font-medium transition-all duration-200 ease-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      'disabled:pointer-events-none disabled:opacity-50'
    );

    const variantStyles = {
      default: cn(
        pressed
          ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30 border-primary/50'
          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border'
      ),
      glass: cn(
        pressed
          ? 'bg-primary/20 text-primary border-primary/40 shadow-sm shadow-primary/20'
          : 'bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 text-white'
      ),
      primary: cn(
        pressed
          ? 'bg-primary/90 text-primary-foreground shadow-md shadow-primary/40'
          : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20'
      ),
    };

    const sizeStyles = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-11 px-6 text-base gap-2',
    };

    return (
      <motion.button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], 'rounded-lg', className)}
        onClick={handleClick}
        aria-pressed={pressed}
        whileHover={!pressed ? { scale: 1.02 } : undefined}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
ToggleButton.displayName = 'ToggleButton';