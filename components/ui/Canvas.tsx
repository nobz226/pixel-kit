'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/design-system/utils';
import { formatBytes } from '@/lib/design-system/utils';

export interface CanvasProps extends React.HTMLAttributes<HTMLDivElement> {
  imageSrc?: string | null;
  imageBitmap?: ImageBitmap | null;
  width?: number;
  height?: number;
  scale?: number;
  checkerboard?: boolean;
  showDimensions?: boolean;
  showFileSize?: boolean;
  fileSize?: number;
  onDownload?: () => void;
  onFullscreen?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export const Canvas = React.forwardRef<HTMLDivElement, CanvasProps>(
  (
    {
      className,
      imageSrc,
      imageBitmap,
      width,
      height,
      scale = 1,
      checkerboard = true,
      showDimensions = true,
      showFileSize = true,
      fileSize,
      onDownload,
      onFullscreen,
      children,
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
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = React.useState({ width: 0, height: 0 });
    const [isDragging, setIsDragging] = React.useState(false);
    const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
    const [pan, setPan] = React.useState({ x: 0, y: 0 });
    const [zoom, setZoom] = React.useState(1);

    React.useEffect(() => {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerSize({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        }
      });

      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }
      return () => resizeObserver.disconnect();
    }, []);

    const handleWheel = (e: React.WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom((prev) => Math.max(0.1, Math.min(5, prev * delta)));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      if (e.button !== 1 && !(e.button === 0 && (e.altKey || e.shiftKey))) return;
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    React.useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      };
      const handleMouseUp = () => setIsDragging(false);
      if (isDragging) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
      }
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isDragging, dragStart]);

    const resetView = () => {
      setPan({ x: 0, y: 0 });
      setZoom(1);
    };

    const fitToContainer = () => {
      if (!imageBitmap && !width) return;
      const imgWidth = imageBitmap?.width || width || 0;
      const imgHeight = imageBitmap?.height || height || 0;
      if (!imgWidth || !imgHeight || !containerSize.width || !containerSize.height) return;

      const scaleX = (containerSize.width - 48) / imgWidth;
      const scaleY = (containerSize.height - 48) / imgHeight;
      const newZoom = Math.min(scaleX, scaleY, 1);
      setZoom(newZoom);
      setPan({ x: 0, y: 0 });
    };

    React.useEffect(() => {
      fitToContainer();
    }, [imageBitmap, width, height, containerSize]);

    const displayWidth = (imageBitmap?.width || width || 0) * zoom;
    const displayHeight = (imageBitmap?.height || height || 0) * zoom;

    return (
      <motion.div
        ref={containerRef}
        className={cn(
          'relative flex-1 flex items-center justify-center overflow-hidden rounded-xl',
          'bg-zinc-950/50 border border-white/10',
          className
        )}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        {...props}
      >
        {checkerboard && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(45deg, #2a2a2c 25%, transparent 25%),
                linear-gradient(-45deg, #2a2a2c 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #2a2a2c 75%),
                linear-gradient(-45deg, transparent 75%, #2a2a2c 75%)
              `,
              backgroundSize: '24px 24px',
              backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0px',
            }}
          />
        )}

        <AnimatePresence mode="wait">
          {(imageSrc || imageBitmap) && (
            <motion.div
              key="image"
              className="relative"
              style={{
                width: displayWidth,
                height: displayHeight,
                transform: `translate(${pan.x}px, ${pan.y}px)`,
                willChange: 'transform',
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt="Canvas preview"
                  className="block max-w-full max-h-full object-contain"
                  style={{ imageRendering: 'crisp-edges' }}
                />
              ) : imageBitmap ? (
                <canvas
                  className="block max-w-full max-h-full object-contain"
                  width={imageBitmap.width}
                  height={imageBitmap.height}
                  style={{ imageRendering: 'crisp-edges' }}
                />
              ) : null}
              {children}
            </motion.div>
          )}
        </AnimatePresence>

        {!imageSrc && !imageBitmap && (
          <motion.div
            className="flex flex-col items-center justify-center gap-4 text-zinc-500 p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <motion.div
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.3 }}
            >
              <svg className="h-8 w-8 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 17" />
              </svg>
            </motion.div>
            <p className="text-sm font-medium text-zinc-400">Drop an image to start</p>
            <p className="text-xs text-zinc-600">Supports JPEG, PNG, WebP, AVIF, GIF</p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {zoom !== 1 && (
            <motion.div
              key="zoom-indicator"
              className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-zinc-950/90 backdrop-blur-xl border border-white/10 px-3 py-1.5 text-xs font-mono text-primary"
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              {Math.round(zoom * 100)}%
              <motion.button
                onClick={resetView}
                className="ml-1 p-0.5 rounded text-zinc-400 hover:text-white hover:bg-white/10"
                aria-label="Reset zoom"
                whileTap={{ scale: 0.8 }}
              >
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="absolute top-3 right-3 flex items-center gap-1"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {showDimensions && width && height && (
            <motion.div
              className="hidden md:flex items-center gap-1.5 rounded-lg bg-zinc-950/90 backdrop-blur-xl border border-white/10 px-3 py-1.5 text-xs font-mono text-zinc-300"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="text-white">{width}</span>
              <span className="text-zinc-500">×</span>
              <span className="text-white">{height}</span>
              <span className="text-zinc-500">px</span>
            </motion.div>
          )}
          {showFileSize && fileSize && (
            <motion.div
              className="hidden lg:flex items-center gap-1.5 rounded-lg bg-zinc-950/90 backdrop-blur-xl border border-white/10 px-3 py-1.5 text-xs font-mono text-zinc-300"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {formatBytes(fileSize)}
            </motion.div>
          )}
        </motion.div>

        <motion.div
          className="absolute bottom-3 right-3 flex items-center gap-1"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {onDownload && (
            <motion.button
              onClick={onDownload}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-950/90 backdrop-blur-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 hover:border-white/20"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Download"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
            </motion.button>
          )}
          {onFullscreen && (
            <motion.button
              onClick={onFullscreen}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-950/90 backdrop-blur-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 hover:border-white/20"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Fullscreen"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    );
  }
);
Canvas.displayName = 'Canvas';

export interface ComparisonCanvasProps extends React.HTMLAttributes<HTMLDivElement> {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
  sliderPosition?: number;
  onSliderChange?: (position: number) => void;
  vertical?: boolean;
}

export const ComparisonCanvas = React.forwardRef<HTMLDivElement, ComparisonCanvasProps>(
  ({
    className,
    beforeSrc,
    afterSrc,
    beforeLabel = 'Before',
    afterLabel = 'After',
    sliderPosition = 50,
    onSliderChange,
    vertical = false,
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
  }, ref) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    React.useEffect(() => {
      const handleMove = (e: MouseEvent | TouchEvent) => {
        if (!isDragging || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        let position: number;
        if (vertical) {
          position = ((clientY - rect.top) / rect.height) * 100;
        } else {
          position = ((clientX - rect.left) / rect.width) * 100;
        }
        onSliderChange?.(Math.max(0, Math.min(100, position)));
      };

      const handleUp = () => setIsDragging(false);

      if (isDragging) {
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchmove', handleMove, { passive: true });
        window.addEventListener('touchend', handleUp);
      }
      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleUp);
      };
    }, [isDragging, onSliderChange, vertical]);

    return (
      <motion.div
        ref={containerRef}
        className={cn(
          'relative overflow-hidden rounded-xl bg-zinc-950/50 border border-white/10',
          className
        )}
        style={{ aspectRatio: '1' }}
        {...props}
      >
        <div className="absolute inset-0">
          <img
            src={beforeSrc}
            alt={beforeLabel}
            className="h-full w-full object-contain"
            style={{ imageRendering: 'crisp-edges' }}
          />
        </div>
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            clipPath: vertical
              ? `polygon(0 0, 100% 0, 100% ${sliderPosition}%, 0 ${sliderPosition}%)`
              : `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
          }}
        >
          <img
            src={afterSrc}
            alt={afterLabel}
            className="h-full w-full object-contain"
            style={{ imageRendering: 'crisp-edges' }}
          />
        </div>
        <div
          className={cn(
            'absolute z-10 flex h-full w-full items-center justify-center',
            vertical ? 'left-0 top-0' : 'left-0 top-0'
          )}
          style={{
            transform: vertical ? `translateY(${sliderPosition}%)` : `translateX(${sliderPosition}%)`,
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
        >
          <motion.div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full bg-white border-2 border-primary shadow-lg',
              vertical ? 'cursor-ns-resize' : 'cursor-ew-resize'
            )}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            animate={{ boxShadow: isDragging ? '0 0 0 4px rgba(0,212,170,0.3), 0 8px 32px rgba(0,0,0,0.6)' : '0 4px 16px rgba(0,0,0,0.5)' }}
            transition={{ duration: 0.2 }}
          >
            <svg
              className={cn('h-4 w-4 text-primary', vertical ? 'rotate-90' : '')}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M8 5l-5 7 5 7" />
              <path d="M16 5l5 7-5 7" />
            </svg>
          </motion.div>
          <motion.div
            className="absolute left-1/2 top-full -translate-x-1/2 mt-2 rounded bg-zinc-950/90 px-2 py-0.5 text-[10px] font-medium text-white whitespace-nowrap border border-white/10"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {Math.round(sliderPosition)}%
          </motion.div>
        </div>
        <motion.div
          className="absolute top-2 left-2 flex items-center gap-1.5 rounded bg-black/60 px-2 py-1 text-xs font-medium text-white"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <span className="w-2 h-2 rounded-full bg-zinc-500" />
          {beforeLabel}
        </motion.div>
        <motion.div
          className="absolute top-2 right-2 flex items-center gap-1.5 rounded bg-black/60 px-2 py-1 text-xs font-medium text-white"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
          <span className="w-2 h-2 rounded-full bg-primary" />
          {afterLabel}
        </motion.div>
      </motion.div>
    );
  }
);
ComparisonCanvas.displayName = 'ComparisonCanvas';