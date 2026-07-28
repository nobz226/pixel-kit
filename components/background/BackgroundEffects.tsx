'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/design-system/utils';

export interface PageBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'mesh' | 'radial' | 'noise' | 'tool';
  className?: string;
}

export const PageBackground = React.forwardRef<HTMLDivElement, PageBackgroundProps>(
  ({ children, variant = 'default', className, onDrag, onDragStart, onDragEnd, onDragEnter, onDragLeave, onDragOver, onDrop, onAnimationStart, onAnimationEnd, onAnimationIteration, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn('relative min-h-screen bg-zinc-950', className)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        {...props}
      >
        {/* Base gradient mesh */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 20% 20%, rgba(0, 212, 170, 0.08) 0%, transparent 50%),
              radial-gradient(ellipse 60% 40% at 80% 80%, rgba(99, 102, 241, 0.06) 0%, transparent 50%),
              radial-gradient(ellipse 50% 60% at 50% 50%, rgba(0, 212, 170, 0.04) 0%, transparent 60%),
              linear-gradient(180deg, #0a0a0b 0%, #111113 50%, #0a0a0b 100%)
            `,
          }}
        />

        {variant === 'mesh' && (
          <>
            <MeshGradient />
            <MeshGradient reverse />
          </>
        )}

        {variant === 'radial' && (
          <RadialGradients />
        )}

        {variant !== 'noise' && <NoiseOverlay intensity={0.03} />}

        <Scanlines opacity={0.02} />

        <Vignette intensity={0.3} />

        <div className="relative z-10">{children}</div>
      </motion.div>
    );
  }
);
PageBackground.displayName = 'PageBackground';

const MeshGradient = ({ reverse = false }: { reverse?: boolean }) => {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 -z-10"
      style={{
        background: `
          radial-gradient(
            ellipse at ${reverse ? '80%' : '20%'} ${reverse ? '80%' : '20%'},
            rgba(0, 212, 170, 0.12) 0%,
            transparent 60%
          ),
          radial-gradient(
            ellipse at ${reverse ? '20%' : '80%'} ${reverse ? '20%' : '80%'},
            rgba(99, 102, 241, 0.08) 0%,
            transparent 60%
          )
        `,
      }}
      animate={{
        scale: [1, 1.15, 1],
        rotate: [0, reverse ? 3 : -3, 0],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
};

const RadialGradients = () => {
  return (
    <>
      <motion.div
        className="pointer-events-none absolute -z-10"
        style={{
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          filter: 'blur(120px)',
          background: 'radial-gradient(circle, rgba(0,212,170,0.15) 0%, transparent 70%)',
          top: '-100px',
          right: '-100px',
        }}
        animate={{
          x: [0, 50, -30, 0],
          y: [0, -30, 50, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute -z-10"
        style={{
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          filter: 'blur(100px)',
          background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
          bottom: '-100px',
          left: '-100px',
        }}
        animate={{
          x: [0, -40, 30, 0],
          y: [0, 40, -20, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
    </>
  );
};

const NoiseOverlay = ({ intensity = 0.03 }: { intensity?: number }) => {
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10"
      style={{
        backgroundImage: `
          url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")
        `,
        opacity: intensity,
        mixBlendMode: 'overlay',
      }}
    />
  );
};

const Scanlines = ({ opacity = 0.02 }: { opacity?: number }) => {
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10"
      style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px)',
        opacity,
        mixBlendMode: 'overlay',
      }}
    />
  );
};

const Vignette = ({ intensity = 0.3 }: { intensity?: number }) => {
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10"
      style={{
        boxShadow: `inset 0 0 ${200 * intensity}px ${100 * intensity}px rgba(0,0,0,${intensity})`,
      }}
    />
  );
};

export interface FloatingOrbsProps extends React.HTMLAttributes<HTMLDivElement> {
  count?: number;
  colors?: string[];
  size?: number;
}

export const FloatingOrbs = React.forwardRef<HTMLDivElement, FloatingOrbsProps>(
  ({ count = 6, colors = ['rgba(0,212,170,0.15)', 'rgba(99,102,241,0.1)', 'rgba(245,158,11,0.1)'], size = 300, className, ...props }, ref) => {
    const orbs = React.useMemo(
      () =>
        Array.from({ length: count }, (_, i) => ({
          id: i,
          color: colors[i % colors.length],
          delay: i * 2,
          duration: 15 + i * 3,
          x: Math.random() * 100,
          y: Math.random() * 100,
        })),
      [count, colors]
    );

    return (
      <div ref={ref} className={cn('pointer-events-none absolute inset-0 -z-10 overflow-hidden', className)} {...props}>
        {orbs.map((orb) => (
          <motion.div
            key={orb.id}
            className="absolute rounded-full filter blur-[80px]"
            style={{
              width: size,
              height: size,
              background: orb.color,
              left: `${orb.x}%`,
              top: `${orb.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            animate={{
              x: [0, (Math.random() - 0.5) * 100, 0],
              y: [0, (Math.random() - 0.5) * 100, 0],
              scale: [1, 1.3, 0.8, 1],
            }}
            transition={{
              duration: orb.duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: orb.delay,
            }}
          />
        ))}
      </div>
    );
  }
);
FloatingOrbs.displayName = 'FloatingOrbs';

export interface ParticleFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  count?: number;
  color?: string;
  speed?: number;
}

export const ParticleField = React.forwardRef<HTMLDivElement, ParticleFieldProps>(
  ({ count = 50, color = 'rgba(0,212,170,0.4)', speed = 1, className, ...props }, ref) => {
    const particles = React.useMemo(
      () =>
        Array.from({ length: count }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.5 + 0.1,
          delay: Math.random() * 5,
          duration: 10 + Math.random() * 20,
        })),
      [count]
    );

    return (
      <div ref={ref} className={cn('pointer-events-none absolute inset-0 -z-10 overflow-hidden', className)} {...props}>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              background: color,
              left: `${p.x}%`,
              top: `${p.y}%`,
              opacity: p.opacity,
            }}
            animate={{
              y: [-100, 100],
              x: [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20],
              opacity: [0, p.opacity, p.opacity, 0],
            }}
            transition={{
              duration: p.duration / speed,
              repeat: Infinity,
              ease: 'linear',
              delay: p.delay,
            }}
          />
        ))}
      </div>
    );
  }
);
ParticleField.displayName = 'ParticleField';