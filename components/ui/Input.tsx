'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/design-system/utils';

const IGNORED_MOTION_PROPS = [
  'onDrag', 'onDragStart', 'onDragEnd', 'onDragEnter', 'onDragLeave', 'onDragOver', 'onDrop',
  'onAnimationStart', 'onAnimationEnd', 'onAnimationIteration',
] as const;

type SafeProps<T> = Omit<T, typeof IGNORED_MOTION_PROPS[number]>;

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'glass' | 'search';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, variant = 'default', id, ...props }, ref) => {
    const inputId = id || React.useId();
    const safeProps = props as SafeProps<React.InputHTMLAttributes<HTMLInputElement>>;

    return (
      <motion.div
        className="w-full"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        {label && (
          <motion.label
            htmlFor={inputId}
            className="mb-1.5 block text-xs font-medium text-zinc-300"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.2 }}
          >
            {label}
          </motion.label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-primary">
              {leftIcon}
            </div>
          )}
          <motion.input
            ref={ref}
            id={inputId}
            className={cn(
              'flex w-full rounded-lg border bg-zinc-950/50 text-white placeholder:text-zinc-500',
              'transition-all duration-200 ease-out',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-zinc-900/50',
              'selection:bg-primary/30',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-red-500/50 focus-visible:ring-red-500/50',
              variant === 'glass' && 'bg-white/5 backdrop-blur-xl border-white/10 placeholder:text-white/40',
              variant === 'search' && 'pl-10 bg-white/5 backdrop-blur-xl border-white/10 text-white',
              className
            )}
            whileFocus={{ scale: 1.002 }}
            {...safeProps}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <motion.p
            className="mt-1.5 text-xs text-red-400 flex items-center gap-1"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg className="h-3 w-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </motion.p>
        )}
        {hint && !error && (
          <motion.p
            className="mt-1.5 text-xs text-zinc-500"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            {hint}
          </motion.p>
        )}
      </motion.div>
    );
  }
);
Input.displayName = 'Input';

export interface NumberInputProps extends Omit<InputProps, 'type' | 'onChange'> {
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  onChange?: (value: number) => void;
  format?: (value: number) => string;
  parse?: (value: string) => number;
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, min = 0, max = 100, step = 1, value, onChange, format, parse, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(format ? format(value ?? min) : String(value ?? min));
    const [isFocused, setIsFocused] = React.useState(false);

    React.useEffect(() => {
      if (!isFocused && value !== undefined) {
        setDisplayValue(format ? format(value) : String(value));
      }
    }, [value, format, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setDisplayValue(e.target.value);
      let numValue = parse ? parse(e.target.value) : Number(e.target.value);
      if (isNaN(numValue)) numValue = min;
      numValue = Math.max(min, Math.min(max, numValue));
      onChange?.(numValue);
    };

    const handleBlur = () => {
      setIsFocused(false);
      let numValue = parse ? parse(displayValue) : Number(displayValue);
      if (isNaN(numValue)) numValue = min;
      numValue = Math.max(min, Math.min(max, numValue));
      setDisplayValue(format ? format(numValue) : String(numValue));
      onChange?.(numValue);
    };

    const handleFocus = () => setIsFocused(true);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const delta = e.key === 'ArrowUp' ? step : -step;
        let numValue = parse ? parse(displayValue) : Number(displayValue);
        if (isNaN(numValue)) numValue = min;
        numValue = Math.max(min, Math.min(max, numValue + delta));
        setDisplayValue(format ? format(numValue) : String(numValue));
        onChange?.(numValue);
      }
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        className={cn('tabular-nums', className)}
        {...props}
      />
    );
  }
);
NumberInput.displayName = 'NumberInput';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, options, placeholder, id, ...props }, ref) => {
    const selectId = id || React.useId();
    const safeProps = props as SafeProps<React.SelectHTMLAttributes<HTMLSelectElement>>;

    return (
      <motion.div
        className="w-full"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        {label && (
          <label htmlFor={selectId} className="mb-1.5 block text-xs font-medium text-zinc-300">
            {label}
          </label>
        )}
        <div className="relative">
          <motion.select
            ref={ref}
            id={selectId}
            className={cn(
              'flex w-full rounded-lg border bg-zinc-950/50 text-white',
              'transition-all duration-200 ease-out',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'appearance-none bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2371717a%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22/%3E%3C/svg%3E")] bg-right-3 bg-center bg-no-repeat pr-10',
              error && 'border-red-500/50 focus-visible:ring-red-500/50',
              className
            )}
            whileFocus={{ scale: 1.002 }}
            {...safeProps}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </motion.select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>
        {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-zinc-500">{hint}</p>}
      </motion.div>
    );
  }
);
Select.displayName = 'Select';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const textareaId = id || React.useId();
    const safeProps = props as SafeProps<React.TextareaHTMLAttributes<HTMLTextAreaElement>>;

    return (
      <motion.div
        className="w-full"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        {label && (
          <label htmlFor={textareaId} className="mb-1.5 block text-xs font-medium text-zinc-300">
            {label}
          </label>
        )}
        <motion.textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'flex w-full min-h-[80px] rounded-lg border bg-zinc-950/50 p-3 text-white placeholder:text-zinc-500',
            'transition-all duration-200 ease-out',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'resize-y',
            error && 'border-red-500/50 focus-visible:ring-red-500/50',
            className
          )}
          whileFocus={{ scale: 1.002 }}
          {...safeProps}
        />
        {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-zinc-500">{hint}</p>}
      </motion.div>
    );
  }
);
Textarea.displayName = 'Textarea';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, ...props }, ref) => {
    const safeProps = props as SafeProps<React.LabelHTMLAttributes<HTMLLabelElement>>;
    return (
      <motion.label
        ref={ref}
        className={cn('text-xs font-medium text-zinc-300', className)}
        {...safeProps}
      >
        {children}
      </motion.label>
    );
  }
);
Label.displayName = 'Label';