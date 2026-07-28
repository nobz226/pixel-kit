'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/design-system/utils';

const IGNORED_EVENTS = [
  'onDrag', 'onDragStart', 'onDragEnd', 'onDragEnter', 'onDragLeave', 'onDragOver', 'onDrop',
  'onAnimationStart', 'onAnimationEnd', 'onAnimationIteration',
] as const;

type StripMotionEvents<T> = Omit<T, typeof IGNORED_EVENTS[number]>;

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated' | 'toolbar' | 'sidebar' | 'floating';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  children: React.ReactNode;
}

const panelVariants = {
  default: 'bg-zinc-950/80 border border-white/10 backdrop-blur-xl',
  glass: 'bg-white/5 border border-white/10 backdrop-blur-xl',
  elevated: 'bg-zinc-950/90 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5),0_2px_8px_rgba(0,0,0,0.4)] backdrop-blur-xl',
  toolbar: 'bg-zinc-950/95 border-r border-white/10 backdrop-blur-xl',
  sidebar: 'bg-zinc-950/95 border-l border-white/10 backdrop-blur-xl',
  floating: 'bg-zinc-950/95 border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.6),0_8px_16px_rgba(0,0,0,0.4)] backdrop-blur-xl',
};

const paddingVariants = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const Panel = React.forwardRef<HTMLDivElement, StripMotionEvents<PanelProps>>(
  ({ className, variant = 'default', padding = 'md', hoverable = false, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          'rounded-xl',
          panelVariants[variant],
          paddingVariants[padding],
          hoverable && 'transition-all duration-300 ease-out hover:border-white/20 hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)]',
          className
        )}
        whileHover={hoverable ? { y: -2, boxShadow: '0 12px 40px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)' } : undefined}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
Panel.displayName = 'Panel';

export interface PanelHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const PanelHeader = React.forwardRef<HTMLDivElement, StripMotionEvents<PanelHeaderProps>>(
  ({ className, title, subtitle, action, icon, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn('flex items-center justify-between mb-4 gap-4', className)}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        {...props}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <motion.div
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17, delay: 0.1 }}
            >
              {icon}
            </motion.div>
          )}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
          </div>
        </div>
        {action && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            {action}
          </motion.div>
        )}
      </motion.div>
    );
  }
);
PanelHeader.displayName = 'PanelHeader';

export interface PanelSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const PanelSection = React.forwardRef<HTMLDivElement, StripMotionEvents<PanelSectionProps>>(
  ({ className, title, collapsible = false, defaultOpen = true, children, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(defaultOpen);

    if (!title && !collapsible) {
      return (
        <motion.div
          ref={ref}
          className={cn('space-y-3', className)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          {...props}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <motion.div
        ref={ref}
        className={cn('border-t border-white/5 pt-4', className)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        {...props}
      >
        <motion.button
          className="flex w-full items-center justify-between gap-2 py-1"
          onClick={() => setIsOpen(!isOpen)}
          style={{ WebkitTapHighlightColor: 'transparent' }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{title}</span>
          </div>
          <motion.span
            className="flex h-5 w-5 items-center justify-center text-zinc-500"
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </motion.span>
        </motion.button>
        <motion.div
          initial={false}
          animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0, marginTop: isOpen ? 4 : 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          style={{ overflow: 'hidden' }}
        >
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            {children}
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }
);
PanelSection.displayName = 'PanelSection';

export const PanelDivider = () => (
  <motion.div
    className="h-px bg-white/5 w-full -mx-4 mx-auto my-3"
    initial={{ scaleX: 0 }}
    animate={{ scaleX: 1 }}
    transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
  />
);

export interface PanelFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const PanelFooter = React.forwardRef<HTMLDivElement, StripMotionEvents<PanelFooterProps>>(
  ({ className, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn('flex items-center gap-2 mt-4 pt-4 border-t border-white/5', className)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
PanelFooter.displayName = 'PanelFooter';