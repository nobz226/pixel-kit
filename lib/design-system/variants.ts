import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from './utils';

export const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'font-medium transition-all duration-200 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
    'active:scale-[0.98]',
    'select-none',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-primary text-primary-foreground',
          'hover:bg-primary/90',
          'shadow-sm shadow-primary/20',
          'hover:shadow-md hover:shadow-primary/30',
        ],
        secondary: [
          'bg-secondary text-secondary-foreground',
          'hover:bg-secondary/80',
          'border border-border',
        ],
        outline: [
          'border border-border bg-transparent',
          'hover:bg-accent hover:text-accent-foreground',
          'hover:border-primary/50',
        ],
        ghost: [
          'bg-transparent',
          'hover:bg-accent hover:text-accent-foreground',
        ],
        destructive: [
          'bg-destructive text-destructive-foreground',
          'hover:bg-destructive/90',
          'shadow-sm shadow-destructive/20',
        ],
        glass: [
          'bg-white/5 backdrop-blur-xl border border-white/10',
          'hover:bg-white/10',
          'text-white',
        ],
        glassPrimary: [
          'bg-primary/10 backdrop-blur-xl border border-primary/30',
          'hover:bg-primary/20',
          'text-primary',
        ],
      },
      size: {
        xs: 'h-7 px-2.5 text-xs gap-1',
        sm: 'h-9 px-3 text-sm gap-1.5',
        md: 'h-10 px-4 text-sm gap-2',
        lg: 'h-11 px-6 text-base gap-2',
        xl: 'h-12 px-8 text-lg gap-2.5',
        icon: 'h-10 w-10',
        iconSm: 'h-8 w-8',
        iconLg: 'h-12 w-12',
      },
      fullWidth: {
        true: 'w-full',
      },
      loading: {
        true: 'cursor-wait',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
    compoundVariants: [
      {
        variant: 'glass',
        size: 'icon',
        className: 'bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10',
      },
    ],
  }
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;

export const inputVariants = cva(
  [
    'flex h-10 w-full rounded-lg border border-border',
    'bg-background text-foreground placeholder:text-muted-foreground',
    'transition-all duration-200 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'selection:bg-primary/30',
  ],
  {
    variants: {
      variant: {
        default: '',
        glass: 'bg-white/5 backdrop-blur-xl border-white/10 text-white placeholder:text-white/40',
        search: 'pl-10 bg-white/5 backdrop-blur-xl border-white/10 text-white',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-5 text-base',
      },
      error: {
        true: 'border-destructive focus-visible:ring-destructive/50',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export type InputVariants = VariantProps<typeof inputVariants>;

export const cardVariants = cva(
  [
    'rounded-xl border border-border bg-card text-card-foreground',
    'transition-all duration-300 ease-out',
  ],
  {
    variants: {
      variant: {
        default: '',
        glass: 'bg-white/5 backdrop-blur-xl border-white/10',
        glassHover: 'bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 hover:border-white/20',
        elevated: 'shadow-xl shadow-black/50 border-border/50',
        outlined: 'border-border bg-transparent',
        filled: 'bg-muted border-transparent',
      },
      padding: {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
      interactive: {
        true: 'cursor-pointer hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
    },
  }
);

export type CardVariants = VariantProps<typeof cardVariants>;

export const badgeVariants = cva(
  [
    'inline-flex items-center gap-1.5 rounded-full',
    'font-medium transition-all duration-200',
    'border border-border',
  ],
  {
    variants: {
      variant: {
        default: 'bg-secondary text-secondary-foreground',
        primary: 'bg-primary/10 text-primary border-primary/30',
        success: 'bg-green-500/10 text-green-400 border-green-500/30',
        warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        destructive: 'bg-destructive/10 text-destructive border-destructive/30',
        outline: 'bg-transparent',
        glass: 'bg-white/5 backdrop-blur-xl border-white/10 text-white',
      },
      size: {
        xs: 'px-2 py-0.5 text-xs gap-1',
        sm: 'px-2.5 py-1 text-xs gap-1',
        md: 'px-3 py-1 text-sm gap-1.5',
        lg: 'px-4 py-1.5 text-base gap-2',
      },
      dot: {
        true: 'before:content-[""] before:w-1.5 before:h-1.5 before:rounded-full before:bg-current',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;

export const tooltipVariants = cva(
  [
    'absolute z-[700] pointer-events-none',
    'rounded-lg px-3 py-2 text-xs font-medium',
    'bg-popover text-popover-foreground border border-border',
    'shadow-lg shadow-black/50 backdrop-blur-xl',
    'animate-in fade-in-0 zoom-in-95 duration-200 ease-out',
    'data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-[state=delayed-open]:duration-200',
  ],
  {
    variants: {
      variant: {
        default: '',
        glass: 'bg-white/5 border-white/10 text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export type TooltipVariants = VariantProps<typeof tooltipVariants>;

export const dropdownVariants = cva(
  [
    'absolute z-[600] min-w-[160px] rounded-xl',
    'bg-popover text-popover-foreground border border-border',
    'shadow-xl shadow-black/50 backdrop-blur-xl',
    'overflow-hidden',
    'animate-in fade-in-0 zoom-in-95 duration-200 ease-out',
    'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
  ],
  {
    variants: {
      variant: {
        default: '',
        glass: 'bg-white/5 border-white/10 text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export type DropdownVariants = VariantProps<typeof dropdownVariants>;

export const dropdownItemVariants = cva(
  [
    'flex items-center gap-2 w-full px-3 py-2',
    'text-sm text-popover-foreground',
    'transition-colors duration-150 ease-out',
    'hover:bg-accent hover:text-accent-foreground',
    'focus-visible:outline-none focus-visible:bg-accent focus-visible:text-accent-foreground',
    'cursor-pointer select-none',
  ],
  {
    variants: {
      variant: {
        default: '',
        destructive: 'text-destructive hover:bg-destructive/10 hover:text-destructive',
        glass: 'text-white hover:bg-white/10',
      },
      inset: {
        true: 'pl-8',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export type DropdownItemVariants = VariantProps<typeof dropdownItemVariants>;

export const separatorVariants = cva(
  'shrink-0 bg-border',
  {
    variants: {
      orientation: {
        horizontal: 'h-[1px] w-full',
        vertical: 'w-[1px] h-full',
      },
      variant: {
        default: '',
        glass: 'bg-white/10',
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
      variant: 'default',
    },
  }
);

export type SeparatorVariants = VariantProps<typeof separatorVariants>;

export const skeletonVariants = cva(
  'animate-pulse rounded-lg bg-muted',
  {
    variants: {
      variant: {
        default: '',
        glass: 'bg-white/5',
        text: 'h-4',
        circular: 'rounded-full',
        rectangular: 'rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export type SkeletonVariants = VariantProps<typeof skeletonVariants>;

export const tabsVariants = cva(
  [
    'inline-flex items-center justify-center gap-1',
    'rounded-lg bg-muted p-1',
    'text-muted-foreground',
  ],
  {
    variants: {
      variant: {
        default: '',
        glass: 'bg-white/5 border border-white/10',
        underline: 'bg-transparent p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export const tabsTriggerVariants = cva(
  [
    'inline-flex items-center justify-center gap-1.5',
    'rounded-md px-3 py-1.5 text-sm font-medium',
    'transition-all duration-200 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
  ],
  {
    variants: {
      variant: {
        default: '',
        glass: 'data-[state=active]:bg-white/10 data-[state=active]:text-white',
        underline: 'data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:rounded-none',
      },
      size: {
        sm: 'px-2.5 py-1 text-xs',
        md: 'px-3 py-1.5 text-sm',
        lg: 'px-4 py-2 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export type TabsVariants = VariantProps<typeof tabsVariants>;
export type TabsTriggerVariants = VariantProps<typeof tabsTriggerVariants>;

export const alertVariants = cva(
  [
    'relative w-full rounded-xl border p-4',
    'flex items-start gap-3',
    'transition-all duration-300 ease-out',
  ],
  {
    variants: {
      variant: {
        default: 'bg-card border-border text-card-foreground',
        destructive: 'bg-destructive/10 border-destructive/30 text-destructive',
        success: 'bg-green-500/10 border-green-500/30 text-green-400',
        warning: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
        info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
        glass: 'bg-white/5 backdrop-blur-xl border-white/10 text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export type AlertVariants = VariantProps<typeof alertVariants>;

export const progressVariants = cva(
  'relative h-2 w-full overflow-hidden rounded-full bg-muted',
  {
    variants: {
      variant: {
        default: '',
        primary: '',
        success: '',
        warning: '',
        destructive: '',
        glass: 'bg-white/5',
      },
      size: {
        xs: 'h-1',
        sm: 'h-1.5',
        md: 'h-2',
        lg: 'h-3',
        xl: 'h-4',
      },
      radius: {
        none: 'rounded-none',
        sm: 'rounded-sm',
        md: 'rounded-full',
        full: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      radius: 'full',
    },
  }
);

export const progressIndicatorVariants = cva(
  'h-full w-full flex-1 rounded-full transition-all duration-300 ease-out',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        primary: 'bg-primary',
        success: 'bg-green-500',
        warning: 'bg-amber-500',
        destructive: 'bg-destructive',
        glass: 'bg-white/30 backdrop-blur-sm',
      },
      striped: {
        true: 'bg-[linear-gradient(45deg,rgba(255,255,255,.15)25%,transparent25%,transparent50%,rgba(255,255,255,.15)50%,rgba(255,255,255,.15)75%,transparent75%,transparent)] bg-[size:1rem_1rem] animate-[stripe_1s_linear_infinite]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export type ProgressVariants = VariantProps<typeof progressVariants>;
export type ProgressIndicatorVariants = VariantProps<typeof progressIndicatorVariants>;

export const switchVariants = cva(
  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full',
  {
    variants: {
      variant: {
        default: 'bg-muted transition-colors data-[state=checked]:bg-primary',
        glass: 'bg-white/5 border border-white/10 transition-colors data-[state=checked]:bg-primary/30 data-[state=checked]:border-primary/50',
      },
      size: {
        sm: 'h-5 w-9',
        md: 'h-6 w-11',
        lg: 'h-7 w-13',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export const switchThumbVariants = cva(
  'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ease-out data-[state=checked]:translate-x-5',
  {
    variants: {
      size: {
        sm: 'h-3.5 w-3.5 data-[state=checked]:translate-x-4',
        md: 'h-4 w-4 data-[state=checked]:translate-x-5',
        lg: 'h-5 w-5 data-[state=checked]:translate-x-6',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export type SwitchVariants = VariantProps<typeof switchVariants>;
export type SwitchThumbVariants = VariantProps<typeof switchThumbVariants>;

export const sliderVariants = cva(
  'relative flex w-full touch-none select-none items-center',
  {
    variants: {
      orientation: {
        horizontal: 'h-4',
        vertical: 'w-4',
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
    },
  }
);

export const sliderTrackVariants = cva(
  'relative h-full w-full grow overflow-hidden rounded-full bg-muted',
  {
    variants: {
      variant: {
        default: '',
        glass: 'bg-white/5 border border-white/10',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export const sliderRangeVariants = cva(
  'absolute h-full bg-primary transition-all duration-300 ease-out',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        success: 'bg-green-500',
        warning: 'bg-amber-500',
        destructive: 'bg-destructive',
        glass: 'bg-white/30 backdrop-blur-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export const sliderThumbVariants = cva(
  [
    'block h-4 w-4 rounded-full bg-background border border-border',
    'shadow-lg transition-all duration-200 ease-out',
    'hover:scale-125 hover:shadow-xl',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
    'active:scale-110',
  ],
  {
    variants: {
      variant: {
        default: 'bg-background border-border',
        primary: 'bg-primary border-primary',
        glass: 'bg-white/10 border-white/20 backdrop-blur-sm',
      },
      size: {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export type SliderVariants = VariantProps<typeof sliderVariants>;
export type SliderTrackVariants = VariantProps<typeof sliderTrackVariants>;
export type SliderRangeVariants = VariantProps<typeof sliderRangeVariants>;
export type SliderThumbVariants = VariantProps<typeof sliderThumbVariants>;