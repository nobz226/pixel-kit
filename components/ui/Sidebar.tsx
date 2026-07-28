'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/design-system/utils';
import { Panel, PanelHeader, PanelSection } from './Panel';
import { Button } from './Button';
import { Input } from './Input';

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, title, subtitle, children, footer, defaultOpen = true, onClose, onDrag, onDragStart, onDragEnd, onAnimationStart, onAnimationEnd, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(defaultOpen);
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    const handleClose = () => {
      setIsOpen(false);
      onClose?.();
    };

    return (
      <motion.aside
        ref={ref}
        className={cn(
          'fixed right-0 top-0 z-40 h-screen flex flex-col',
          'border-l border-white/10 bg-zinc-950/95 backdrop-blur-xl',
          'transition-all duration-300 ease-out',
          isCollapsed ? 'w-16' : 'w-96',
          className
        )}
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        }}
        initial={false}
        animate={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        {...props}
      >
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              key="header"
              className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-white">{title}</h2>
                {subtitle && <p className="truncate text-xs text-zinc-500">{subtitle}</p>}
              </div>
              <motion.button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                whileTap={{ scale: 0.9 }}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <motion.svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  animate={{ rotate: isCollapsed ? 180 : 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <path d="M15 18l-6-6 6-6" />
                </motion.svg>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              key="content"
              className="flex-1 overflow-y-auto p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.25 }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {!isCollapsed && footer && (
            <motion.div
              key="footer"
              className="border-t border-white/10 p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              {footer}
            </motion.div>
          )}
        </AnimatePresence>

        {isCollapsed && (
          <motion.button
            onClick={() => setIsCollapsed(false)}
            className="absolute -left-12 top-1/2 -translate-y-1/2 h-12 w-12 items-center justify-center rounded-r-lg border border-white/10 bg-zinc-950/95 backdrop-blur-xl shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Expand sidebar"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.svg
              className="h-5 w-5 text-zinc-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              animate={{ rotate: 180 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <path d="M15 18l-6-6 6-6" />
            </motion.svg>
          </motion.button>
        )}
      </motion.aside>
    );
  }
);
Sidebar.displayName = 'Sidebar';

export interface SidebarTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const SidebarTrigger = React.forwardRef<HTMLButtonElement, SidebarTriggerProps>(
  ({ className, children, onDrag, onDragStart, onDragEnd, onAnimationStart, onAnimationEnd, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={cn(
          'fixed right-4 bottom-4 z-50 flex h-12 w-12 items-center justify-center rounded-xl',
          'bg-zinc-950/95 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/50',
          'text-zinc-400 hover:text-white hover:bg-white/5 hover:border-white/20',
          'transition-all duration-200 ease-out',
          className
        )}
        whileHover={{ scale: 1.05, boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17, delay: 0.5 }}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
SidebarTrigger.displayName = 'SidebarTrigger';

export interface PropertyGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export const PropertyGroup = React.forwardRef<HTMLDivElement, PropertyGroupProps>(
  ({ className, label, children, collapsible = false, defaultOpen = true, onDrag, onDragStart, onDragEnd, onAnimationStart, onAnimationEnd, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(defaultOpen);

    return (
      <motion.div
        ref={ref}
        className={cn('space-y-3', className)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        {...props}
      >
        {label && (
          <motion.div
            className={cn(
              'flex items-center gap-2 px-1 py-2 text-xs font-medium text-zinc-400 uppercase tracking-wider',
              collapsible && 'cursor-pointer hover:text-white'
            )}
            onClick={() => collapsible && setIsOpen(!isOpen)}
            style={{ cursor: collapsible ? 'pointer' : 'default' }}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {collapsible && (
              <motion.span
                className="flex-shrink-0 text-zinc-500"
                animate={{ rotate: isOpen ? 90 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                ▸
              </motion.span>
            )}
            <span>{label}</span>
          </motion.div>
        )}
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              key="content"
              initial={{ opacity: 0, height: 0, paddingTop: 0 }}
              animate={{ opacity: 1, height: 'auto', paddingTop: 4 }}
              exit={{ opacity: 0, height: 0, paddingTop: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              style={{ overflow: 'hidden' }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);
PropertyGroup.displayName = 'PropertyGroup';

export interface PropertyRowProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  children: React.ReactNode;
  hint?: string;
  error?: string;
}

export const PropertyRow = React.forwardRef<HTMLDivElement, PropertyRowProps>(
  ({ className, label, children, hint, error, onDrag, onDragStart, onDragEnd, onAnimationStart, onAnimationEnd, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn('space-y-1.5', className)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        {...props}
      >
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-zinc-300">{label}</label>
          {hint && <span className="text-xs text-zinc-500">{hint}</span>}
        </div>
        <div className="relative">{children}</div>
        {error && (
          <motion.p className="text-xs text-red-400 flex items-center gap-1" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </motion.p>
        )}
      </motion.div>
    );
  }
);
PropertyRow.displayName = 'PropertyRow';

export interface SliderInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  showValue?: boolean;
  unit?: string;
  marks?: Array<{ value: number; label: string }>;
}

export const SliderInput = React.forwardRef<HTMLDivElement, SliderInputProps>(
  ({ className, label, min, max, step = 1, value, onChange, showValue = true, unit, marks, onDrag, onDragStart, onDragEnd, onAnimationStart, onAnimationEnd, ...props }, ref) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const trackRef = React.useRef<HTMLDivElement>(null);

    const percentage = ((value - min) / (max - min)) * 100;

    const updateFromClientX = (clientX: number) => {
      setIsDragging(true);
      const track = trackRef.current;
      if (!track) return;

      const rect = track.getBoundingClientRect();
      const newPercentage = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      const newValue = min + (newPercentage / 100) * (max - min);
      const steppedValue = Math.round(newValue / step) * step;
      onChange(Math.max(min, Math.min(max, steppedValue)));
    };

    const handleNativeMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      updateFromClientX(clientX);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleNativeMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleNativeMove);
      document.removeEventListener('touchend', handleMouseUp);
    };

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      updateFromClientX(clientX);
      document.addEventListener('mousemove', handleNativeMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleNativeMove, { passive: true });
      document.addEventListener('touchend', handleMouseUp);
    };

    return (
      <motion.div
        ref={ref}
        className={cn('relative', className)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        {...props}
      >
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-sm font-medium text-zinc-300">{label}</span>}
          {showValue && (
            <motion.span
              className="text-sm font-mono tabular-nums text-primary bg-primary/10 px-2 py-0.5 rounded"
              key={value}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              {value}{unit && <span className="text-zinc-400 font-normal ml-0.5">{unit}</span>}
            </motion.span>
          )}
        </div>

        <div
          ref={trackRef}
          className="relative h-2 rounded-full bg-white/5 cursor-pointer touch-none"
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-label={label}
        >
          <motion.div
            className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
            style={{ width: `${percentage}%` }}
            animate={{ width: `${percentage}%` }}
            transition={{ type: 'spring', stiffness: 400, damping: 25, duration: 0.3 }}
          />
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-white border-2 border-primary shadow-lg"
            style={{ left: `calc(${percentage}% - 10px)` }}
            animate={{ left: `calc(${percentage}% - 10px)`, scale: isDragging ? 1.3 : 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          />
          {marks && marks.map((mark) => (
            <motion.div
              key={mark.value}
              className="absolute top-1/2 -translate-y-1/2 h-2 w-px bg-white/20"
              style={{ left: `${((mark.value - min) / (max - min)) * 100}%` }}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ delay: 0.1 }}
            />
          ))}
        </div>

        {marks && (
          <div className="flex justify-between mt-2 text-[10px] text-zinc-500">
            {marks.map((mark) => (
              <motion.span key={mark.value} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
                {mark.label}
              </motion.span>
            ))}
          </div>
        )}
      </motion.div>
    );
  }
);
SliderInput.displayName = 'SliderInput';

export interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Array<{ value: string; label: string; icon?: React.ReactNode }>;
  placeholder?: string;
  error?: string;
}

export const SelectInput = React.forwardRef<HTMLSelectElement, SelectInputProps>(
  ({ className, label, options, placeholder, error, ...props }, ref) => {
    return (
      <motion.div
        className={cn('relative', className)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {label && <label className="mb-1.5 block text-xs font-medium text-zinc-300">{label}</label>}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'flex h-10 w-full appearance-none rounded-lg border bg-zinc-950/50 px-3 pr-8 text-sm text-white',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
              'hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-red-500/50 focus-visible:ring-red-500/50',
              className
            )}
            {...props}
          >
            {placeholder && <option value="" disabled>{placeholder}</option>}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>
        {error && (
          <motion.p className="mt-1.5 text-xs text-red-400" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
            {error}
          </motion.p>
        )}
      </motion.div>
    );
  }
);
SelectInput.displayName = 'SelectInput';

export interface ToggleInputProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const ToggleInput = React.forwardRef<HTMLButtonElement, ToggleInputProps>(
  ({ className, label, description, checked, onChange, onDrag, onDragStart, onDragEnd, onAnimationStart, onAnimationEnd, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg p-3 transition-all duration-200',
          'hover:bg-white/5',
          checked ? 'bg-primary/10 border border-primary/30' : 'border border-white/5',
          className
        )}
        onClick={() => onChange(!checked)}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        {...props}
      >
        <motion.div
          className={cn(
            'relative flex h-6 w-11 shrink-0 items-center rounded-full border-2 transition-all duration-300 ease-out',
            checked ? 'bg-primary border-primary' : 'bg-white/5 border-white/10'
          )}
          animate={{ backgroundColor: checked ? 'var(--primary)' : 'rgba(255,255,255,0.05)' }}
        >
          <motion.span
            className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-lg transition-transform duration-300 ease-out"
            animate={{ x: checked ? 24 : 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          />
        </motion.div>
        <div className="flex-1 min-w-0">
          <p className={cn('font-medium truncate', checked ? 'text-white' : 'text-zinc-300')}>{label}</p>
          {description && <p className="text-xs text-zinc-500 truncate">{description}</p>}
        </div>
      </motion.button>
    );
  }
);
ToggleInput.displayName = 'ToggleInput';

export interface ColorInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  presets?: string[];
}

export const ColorInput = React.forwardRef<HTMLDivElement, ColorInputProps>(
  ({ className, label, value, onChange, presets, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn('relative', className)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {label && <label className="mb-1.5 block text-xs font-medium text-zinc-300">{label}</label>}
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            {...props}
          />
          <div
            className="relative h-10 w-full rounded-lg border border-white/10 overflow-hidden"
            style={{ backgroundColor: value }}
          >
            <motion.div
              className="absolute inset-0 flex items-center justify-center px-3 text-sm font-mono text-white mix-blend-difference"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {value.toUpperCase()}
            </motion.div>
          </div>
        </div>
        {presets && presets.length > 0 && (
          <motion.div
            className="flex flex-wrap gap-1.5 mt-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {presets.map((color) => (
              <motion.button
                key={color}
                onClick={() => onChange(color)}
                className={cn(
                  'h-8 w-8 rounded-lg border-2 transition-all duration-200',
                  value === color ? 'border-primary scale-110 shadow-[0_0_0_2px_rgba(0,212,170,0.4)]' : 'border-white/10 hover:border-white/30'
                )}
                style={{ backgroundColor: color }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </motion.div>
        )}
      </motion.div>
    );
  }
);
ColorInput.displayName = 'ColorInput';