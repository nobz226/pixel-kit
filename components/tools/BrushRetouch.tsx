'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/design-system/utils';
import { drawCheckerboard, canvasToBlob } from '@/lib/canvas-utils';

interface BrushRetouchProps {
  resultBitmap: ImageBitmap;
  originalPreviewUrl: string;
  width: number;
  height: number;
  onApply: (blob: Blob) => void;
  onCancel: () => void;
  backgroundColor?: string;
  showCheckerboard?: boolean;
}

export function BrushRetouch({
  resultBitmap,
  originalPreviewUrl,
  width,
  height,
  onApply,
  onCancel,
  backgroundColor = '#ffffff',
  showCheckerboard = true,
}: BrushRetouchProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement>(null);
  const [originalImageLoaded, setOriginalImageLoaded] = useState(false);

  const [brushSize, setBrushSize] = useState(40);
  const [mode, setMode] = useState<'erase' | 'restore'>('erase');
  const [showOriginal, setShowOriginal] = useState(false);
  const [isPainting, setIsPainting] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });

  // Load original image
  useEffect(() => {
    const img = new Image();
    img.src = originalPreviewUrl;
    img.onload = () => {
      originalImageRef.current = img;
      setOriginalImageLoaded(true);
      if (maskCanvasRef.current) {
        const ctx = maskCanvasRef.current.getContext('2d');
        if (ctx) {
          const dataUrl = maskCanvasRef.current.toDataURL();
          setHistory([dataUrl]);
          setHistoryIndex(0);
        }
      }
    };
    originalImageRef.current = img;
  }, [originalPreviewUrl]);

  // Initialize mask canvas with white (fully visible)
  useEffect(() => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }, [width, height]);

  // Initialize offscreen canvas for compositing
  useEffect(() => {
    const canvas = offscreenCanvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
  }, [width, height]);

  // Reset zoom/pan when width/height change
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [width, height]);

  const renderComposite = useCallback(() => {
    const displayCanvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const offscreenCanvas = offscreenCanvasRef.current;
    if (!displayCanvas || !maskCanvas || !offscreenCanvas) return;

    const displayCtx = displayCanvas.getContext('2d');
    const offscreenCtx = offscreenCanvas.getContext('2d');
    if (!displayCtx || !offscreenCtx) return;

    const container = displayCanvas.parentElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const containerWidth = rect.width;
    const containerHeight = rect.height;

    if (displayCanvas.width !== containerWidth || displayCanvas.height !== containerHeight) {
      displayCanvas.width = containerWidth;
      displayCanvas.height = containerHeight;
    }

    displayCtx.clearRect(0, 0, containerWidth, containerHeight);

    // Apply zoom/pan transform
    displayCtx.save();
    const cx = containerWidth / 2;
    const cy = containerHeight / 2;
    displayCtx.translate(cx + pan.x, cy + pan.y);
    displayCtx.scale(zoom, zoom);
    displayCtx.translate(-cx, -cy);

    if (showCheckerboard) {
      drawCheckerboard(displayCtx, containerWidth, containerHeight, 24, '#2a2a2c', '#1e1e20');
    } else {
      displayCtx.fillStyle = backgroundColor;
      displayCtx.fillRect(0, 0, containerWidth, containerHeight);
    }

    const scaleX = containerWidth / width;
    const scaleY = containerHeight / height;
    const drawScale = Math.min(scaleX, scaleY, 1);
    const drawWidth = width * drawScale;
    const drawHeight = height * drawScale;
    const drawX = (containerWidth - drawWidth) / 2;
    const drawY = (containerHeight - drawHeight) / 2;

    // Layer 1: result clipped by mask
    offscreenCtx.clearRect(0, 0, width, height);
    offscreenCtx.drawImage(resultBitmap, 0, 0);
    offscreenCtx.globalCompositeOperation = 'destination-in';
    offscreenCtx.drawImage(maskCanvas, 0, 0);
    offscreenCtx.globalCompositeOperation = 'source-over';

    displayCtx.drawImage(
      offscreenCanvas,
      drawX,
      drawY,
      drawWidth,
      drawHeight
    );

    // Layer 2: original clipped by inverted mask
    if (showOriginal && originalImageLoaded && originalImageRef.current) {
      offscreenCtx.clearRect(0, 0, width, height);
      offscreenCtx.drawImage(originalImageRef.current, 0, 0, width, height);
      offscreenCtx.globalCompositeOperation = 'destination-out';
      offscreenCtx.drawImage(maskCanvas, 0, 0);
      offscreenCtx.globalCompositeOperation = 'source-over';

      displayCtx.drawImage(
        offscreenCanvas,
        drawX,
        drawY,
        drawWidth,
        drawHeight
      );
    }

    displayCtx.restore();
  }, [resultBitmap, width, height, backgroundColor, showCheckerboard, originalImageLoaded, showOriginal, zoom, pan]);

  useEffect(() => {
    renderComposite();
  }, [renderComposite]);

  const getImageCoords = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const containerWidth = rect.width;
      const containerHeight = rect.height;

      // Reverse the zoom/pan transform
      const cx = containerWidth / 2;
      const cy = containerHeight / 2;
      const tx = ((clientX - rect.left - cx - pan.x) / zoom) + cx;
      const ty = ((clientY - rect.top - cy - pan.y) / zoom) + cy;

      const scaleX = containerWidth / width;
      const scaleY = containerHeight / height;
      const drawScale = Math.min(scaleX, scaleY, 1);
      const drawWidth = width * drawScale;
      const drawHeight = height * drawScale;
      const drawX = (containerWidth - drawWidth) / 2;
      const drawY = (containerHeight - drawHeight) / 2;

      const x = (tx - drawX) / drawScale;
      const y = (ty - drawY) / drawScale;
      return { x, y };
    },
    [width, height, zoom, pan]
  );

  const paintOnMask = useCallback(
    (x: number, y: number) => {
      const maskCanvas = maskCanvasRef.current;
      if (!maskCanvas) return;
      const ctx = maskCanvas.getContext('2d');
      if (!ctx) return;

      ctx.globalCompositeOperation = mode === 'erase' ? 'destination-out' : 'source-over';
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();

      renderComposite();
    },
    [mode, brushSize, renderComposite]
  );

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.min(Math.max(prev * delta, 0.1), 50));
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      lastPointer.current = { x: e.clientX, y: e.clientY };

      if (e.button === 1 || e.shiftKey) {
        isPanning.current = true;
        return;
      }

      const coords = getImageCoords(e.clientX, e.clientY);
      if (!coords) return;
      if (coords.x < 0 || coords.x > width || coords.y < 0 || coords.y > height) return;

      const maskCanvas = maskCanvasRef.current;
      if (maskCanvas) {
        const dataUrl = maskCanvas.toDataURL();
        setHistory((prev) => {
          const newHistory = prev.slice(0, historyIndex + 1);
          newHistory.push(dataUrl);
          return newHistory.slice(-20);
        });
        setHistoryIndex((prev) => Math.min(prev + 1, 19));
      }

      setIsPainting(true);
      paintOnMask(coords.x, coords.y);
    },
    [getImageCoords, width, height, historyIndex, paintOnMask]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (isPanning.current) {
        const dx = e.clientX - lastPointer.current.x;
        const dy = e.clientY - lastPointer.current.y;
        lastPointer.current = { x: e.clientX, y: e.clientY };
        setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        return;
      }
      if (!isPainting) return;
      e.preventDefault();
      const coords = getImageCoords(e.clientX, e.clientY);
      if (!coords) return;
      if (coords.x < 0 || coords.x > width || coords.y < 0 || coords.y > height) return;
      paintOnMask(coords.x, coords.y);
    },
    [isPainting, getImageCoords, width, height, paintOnMask]
  );

  const handlePointerUp = useCallback(() => {
    setIsPainting(false);
    isPanning.current = false;
  }, []);

  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return;
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return;

    const newIndex = historyIndex - 1;
    const img = new Image();
    img.src = history[newIndex];
    img.onload = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0);
      setHistoryIndex(newIndex);
      renderComposite();
    };
  }, [history, historyIndex, width, height, renderComposite]);

  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return;

    const newIndex = historyIndex + 1;
    const img = new Image();
    img.src = history[newIndex];
    img.onload = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0);
      setHistoryIndex(newIndex);
      renderComposite();
    };
  }, [history, historyIndex, width, height, renderComposite]);

  const handleReset = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const dataUrl = maskCanvas.toDataURL();
    setHistory([dataUrl]);
    setHistoryIndex(0);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    renderComposite();
  }, [width, height, renderComposite]);

  const handleApply = useCallback(async () => {
    const offscreenCanvas = offscreenCanvasRef.current;
    if (!offscreenCanvas) return;

    const ctx = offscreenCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(resultBitmap, 0, 0);
    ctx.globalCompositeOperation = 'destination-in';
    const maskCanvas = maskCanvasRef.current;
    if (maskCanvas) {
      ctx.drawImage(maskCanvas, 0, 0);
    }
    ctx.globalCompositeOperation = 'source-over';

    const blob = await canvasToBlob(offscreenCanvas, { mimeType: 'image/png', quality: 1 });
    onApply(blob);
  }, [width, height, resultBitmap, onApply]);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950/95 backdrop-blur-sm p-4 sm:p-8">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Retouch Brush</h2>
        <button
          type="button"
          onClick={handleCancel}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
          Close
        </button>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative overflow-hidden bg-zinc-950/50 rounded-xl border border-white/10">
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{ touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
        />
        <canvas ref={maskCanvasRef} className="hidden" />
        <canvas ref={offscreenCanvasRef} className="hidden" />
        {/* Zoom info overlay */}
        {zoom !== 1 && (
          <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/60 text-xs text-zinc-400 font-mono">
            {Math.round(zoom * 100)}%
          </div>
        )}
      </div>

      {/* Brush Controls */}
      <motion.div
        className="mt-4 p-4 bg-zinc-950/80 border border-white/10 rounded-xl backdrop-blur-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Brush Size */}
          <div className="flex items-center gap-3 flex-1 min-w-[200px]">
            <span className="text-sm font-medium text-zinc-300 w-20">Brush Size</span>
            <input
              type="range"
              min={5}
              max={200}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="flex-1 h-2 rounded-full bg-white/5 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/20 [&::-webkit-slider-thumb]:shadow-lg"
            />
            <span className="text-sm font-mono text-primary w-12 text-right">{brushSize}px</span>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-zinc-300">Mode</span>
            <div className="flex rounded-lg bg-white/5 border border-white/10 p-1">
              <button
                type="button"
                onClick={() => setMode('erase')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                  mode === 'erase'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                )}
              >
                Erase
              </button>
              <button
                type="button"
                onClick={() => setMode('restore')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                  mode === 'restore'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'text-zinc-400 hover:text-white'
                )}
              >
                Restore
              </button>
            </div>
          </div>

          {/* Show Original Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowOriginal((v) => !v)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium border transition-all',
                showOriginal
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  : 'text-zinc-400 hover:text-white border-transparent'
              )}
            >
              {showOriginal ? 'Original On' : 'Original Off'}
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setZoom((v) => Math.max(v - 0.5, 0.1))}
              className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Zoom out"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
                <path d="M8 11h6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              className="px-2 py-1 rounded-md text-xs font-mono text-zinc-400 hover:text-white hover:bg-white/5 transition-colors min-w-[3rem] text-center"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={() => setZoom((v) => Math.min(v + 0.5, 50))}
              className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Zoom in"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
                <path d="M8 11h6M11 8v6" />
              </svg>
            </button>
          </div>

          {/* Undo/Redo */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Undo"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7v6h6" />
                <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Redo"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 7v6h-6" />
                <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
              </svg>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-1.5 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Apply & Download
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}