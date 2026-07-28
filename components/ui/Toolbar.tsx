'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/design-system/utils';

export interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  orientation?: 'vertical' | 'horizontal';
  compact?: boolean;
}

export const Toolbar = React.forwardRef<HTMLDivElement, ToolbarProps>(
  ({ className, children, orientation = 'vertical', compact = false, onDrag, onDragStart, onDragEnd, onDragEnter, onDragLeave, onDragOver, onDrop, onAnimationStart, onAnimationEnd, onAnimationIteration, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          'flex gap-1',
          orientation === 'vertical' ? 'flex-col' : 'flex-row',
          compact ? 'p-1.5' : 'p-2',
          className
        )}
        initial={{ opacity: 0, x: orientation === 'vertical' ? -30 : 0, y: orientation === 'horizontal' ? -30 : 0 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        {...props}
      >
        {React.Children.map(children, (child, index) =>
          React.isValidElement(child) ? (
            React.cloneElement(child as React.ReactElement<{ style?: React.CSSProperties }>, {
              key: child.key || index,
              style: { ...((child.props as { style?: React.CSSProperties }).style || {}), transitionDelay: `${index * 0.05}s` },
            })
          ) : child
        )}
      </motion.div>
    );
  }
);
Toolbar.displayName = 'Toolbar';

export interface ToolbarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  label?: string;
}

export const ToolbarGroup = React.forwardRef<HTMLDivElement, ToolbarGroupProps>(
  ({ className, children, label, onDrag, onDragStart, onDragEnd, onDragEnter, onDragLeave, onDragOver, onDrop, onAnimationStart, onAnimationEnd, onAnimationIteration, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn('flex flex-col gap-0.5', className)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        {...props}
      >
        {label && (
          <motion.div
            className="px-1 pb-1 text-[10px] font-medium text-zinc-500 uppercase tracking-wider"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {label}
          </motion.div>
        )}
        <motion.div
          className="flex flex-col gap-0.5"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          {children}
        </motion.div>
        <motion.div
          className="h-px bg-white/5 w-full my-1"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.4, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
        />
      </motion.div>
    );
  }
);
ToolbarGroup.displayName = 'ToolbarGroup';

export interface ToolButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  active?: boolean;
  variant?: 'default' | 'primary' | 'danger';
  badge?: React.ReactNode;
}

export const ToolButton = React.forwardRef<HTMLButtonElement, ToolButtonProps>(
  ({ className, icon, label, shortcut, active = false, variant = 'default', badge, children, onDrag, onDragStart, onDragEnd, onDragEnter, onDragLeave, onDragOver, onDrop, onAnimationStart, onAnimationEnd, onAnimationIteration, ...props }, ref) => {
    const [isHovered, setIsHovered] = React.useState(false);

    const baseStyles = 'relative flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200 ease-out';
    const variantStyles = {
      default: 'text-zinc-400 hover:text-white hover:bg-white/5 active:bg-white/10',
      primary: 'text-primary hover:bg-primary/10 active:bg-primary/20',
      danger: 'text-red-400 hover:text-red-300 hover:bg-red-500/10 active:bg-red-500/20',
    };
    const activeStyles = active
      ? 'bg-primary/10 text-primary border border-primary/30 shadow-[0_0_0_1px_rgba(0,212,170,0.3)]'
      : '';

    return (
      <motion.button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], activeStyles, className)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileTap={{ scale: 0.92 }}
        whileHover={isHovered && !active ? { scale: 1.08, boxShadow: '0 4px 12px rgba(0,0,0,0.4)' } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 17, delay: 0.1 }}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        aria-label={shortcut ? `${label} (${shortcut})` : label}
        title={shortcut ? `${label} (${shortcut})` : label}
        {...props}
      >
        <motion.span
          className="flex h-full w-full items-center justify-center"
          animate={{ scale: active ? 1.1 : 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          {icon}
        </motion.span>
        {badge && (
          <motion.span
            className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-white"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 600, damping: 12, delay: 0.2 }}
          >
            {badge}
          </motion.span>
        )}
      </motion.button>
    );
  }
);
ToolButton.displayName = 'ToolButton';

export interface ToolButtonWithTooltipProps extends ToolButtonProps {
  tooltipSide?: 'left' | 'right' | 'top' | 'bottom';
  tooltipDelay?: number;
}

export const ToolButtonWithTooltip = React.forwardRef<HTMLButtonElement, ToolButtonWithTooltipProps>(
  ({ tooltipSide = 'left', tooltipDelay = 500, ...props }, ref) => {
    const [showTooltip, setShowTooltip] = React.useState(false);
    const timerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const handleMouseEnter = () => {
      timerRef.current = setTimeout(() => setShowTooltip(true), tooltipDelay);
    };

    const handleMouseLeave = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setShowTooltip(false);
    };

    const tooltipPosition = {
      left: 'right-full mr-2',
      right: 'left-full ml-2',
      top: 'bottom-full mb-2',
      bottom: 'top-full mt-2',
    };

    return (
      <div className="relative flex items-center justify-center" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <ToolButton ref={ref} {...props} />
        {showTooltip && (
          <motion.div
            className={cn(
              'absolute z-50 pointer-events-none',
              'px-2 py-1 rounded-md text-[11px] font-medium text-white',
              'bg-zinc-900/95 border border-white/10 backdrop-blur-xl shadow-lg',
              'whitespace-nowrap',
              tooltipPosition[tooltipSide]
            )}
            initial={{ opacity: 0, scale: 0.9, y: tooltipSide === 'top' ? 2 : tooltipSide === 'bottom' ? -2 : 0, x: tooltipSide === 'left' ? 2 : tooltipSide === 'right' ? -2 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            {props.label}{props.shortcut ? <span className="ml-2 text-zinc-500">⌘{props.shortcut}</span> : null}
          </motion.div>
        )}
      </div>
    );
  }
);
ToolButtonWithTooltip.displayName = 'ToolButtonWithTooltip';