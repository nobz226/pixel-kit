'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Dropzone } from '@/components/ui/Dropzone';
import {
  loadImageWithExif,
  canvasToBlob,
  downloadBlob,
  getOutputFilename,
  formatFileSize,
  estimateFileSize,
} from '@/lib/canvas-utils';
import { calculateResizeDimensions } from '@/lib/tools/resize';
import { ResizeOptions } from '@/lib/tools/types';
import { PageBackground } from '@/components/background/BackgroundEffects';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Panel, PanelHeader } from '@/components/ui/Panel';

const MAX_DIMENSION = 10000;
const MAX_FILE_SIZE = 100 * 1024 * 1024;

type ResizeMode = 'dimensions' | 'percentage';

export default function ResizePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [bitmaps, setBitmaps] = useState<Map<number, ImageBitmap>>(new Map());
  const [previews, setPreviews] = useState<Map<number, string>>(new Map());
  const [mode, setMode] = useState<ResizeMode>('dimensions');
  const [width, setWidth] = useState<number | ''>('');
  const [height, setHeight] = useState<number | ''>('');
  const [percentage, setPercentage] = useState<number | ''>(100);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<
    Array<{ blob: Blob; filename: string; originalName: string }>
  >([]);
  const [originalDimensions, setOriginalDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const handleFiles = useCallback(async (newFiles: File[]) => {
    setError(null);
    const validFiles = newFiles.filter((f) => f.size <= MAX_FILE_SIZE);
    if (validFiles.length !== newFiles.length) {
      setError('Some files exceed the 100MB limit and were skipped');
    }
    setFiles(validFiles);
    setResults([]);

    const newBitmaps = new Map<number, ImageBitmap>();
    const newPreviews = new Map<number, string>();

    for (let i = 0; i < validFiles.length; i++) {
      try {
        const bitmap = await loadImageWithExif(validFiles[i]);
        newBitmaps.set(i, bitmap);

        const previewUrl = URL.createObjectURL(validFiles[i]);
        newPreviews.set(i, previewUrl);

        if (i === 0) {
          setWidth(bitmap.width);
          setHeight(bitmap.height);
          setPercentage(100);
          setOriginalDimensions({ width: bitmap.width, height: bitmap.height });
        }
      } catch (err) {
        setError(
          `Failed to load ${validFiles[i].name}: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      }
    }

    setBitmaps(newBitmaps);
    setPreviews(newPreviews);
  }, []);

  const updatePreviews = useCallback(async () => {
    if (bitmaps.size === 0) return;

    const newPreviews = new Map<number, string>();

    for (const [index, bitmap] of bitmaps) {
      let options: ResizeOptions;
      if (mode === 'percentage') {
        options = { percentage: percentage as number };
      } else {
        options = {
          width: width as number,
          height: height as number,
          lockAspectRatio,
        };
      }

      const { width: targetWidth, height: targetHeight } = calculateResizeDimensions(
        bitmap.width,
        bitmap.height,
        options
      );

      const canvas = new OffscreenCanvas(targetWidth, targetHeight);
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

      const blob = await canvas.convertToBlob({ type: 'image/png', quality: 0.92 });
      newPreviews.set(index, URL.createObjectURL(blob));
    }

    setPreviews(newPreviews);
  }, [bitmaps, mode, width, height, percentage, lockAspectRatio]);

  const triggerPreviewUpdate = useCallback(() => {
    updatePreviews();
  }, [updatePreviews]);

  const handleDimensionChange = useCallback(
    (dimension: 'width' | 'height', value: number | '') => {
      if (value === '' || !lockAspectRatio || !originalDimensions) {
        if (dimension === 'width') setWidth(value);
        else setHeight(value);
        triggerPreviewUpdate();
        return;
      }

      const ratio = originalDimensions.width / originalDimensions.height;

      if (dimension === 'width' && typeof value === 'number') {
        setWidth(value);
        setHeight(Math.round(value / ratio));
      } else if (dimension === 'height' && typeof value === 'number') {
        setHeight(value);
        setWidth(Math.round(value * ratio));
      }
      triggerPreviewUpdate();
    },
    [lockAspectRatio, originalDimensions, triggerPreviewUpdate]
  );

  const handlePercentageChange = useCallback(
    (value: number | '') => {
      if (value === '') {
        setPercentage(value);
        triggerPreviewUpdate();
        return;
      }
      const clamped = Math.max(1, Math.min(1000, value));
      setPercentage(clamped);

      if (!originalDimensions) return;

      const newWidth = Math.round(originalDimensions.width * (clamped / 100));
      const newHeight = Math.round(originalDimensions.height * (clamped / 100));
      setWidth(newWidth);
      setHeight(newHeight);
      triggerPreviewUpdate();
    },
    [originalDimensions, triggerPreviewUpdate]
  );

  const handleModeChange = useCallback(
    (newMode: ResizeMode) => {
      setMode(newMode);
      triggerPreviewUpdate();
    },
    [triggerPreviewUpdate]
  );

  const handleLockAspectRatioChange = useCallback(
    (checked: boolean) => {
      setLockAspectRatio(checked);
      triggerPreviewUpdate();
    },
    [triggerPreviewUpdate]
  );

  const handleProcess = useCallback(async () => {
    if (files.length === 0 || bitmaps.size === 0) return;

    setProcessing(true);
    setError(null);
    const newResults: Array<{ blob: Blob; filename: string; originalName: string }> = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const bitmap = bitmaps.get(i);
        if (!bitmap) continue;

        let options: ResizeOptions;
        if (mode === 'percentage') {
          options = { percentage: percentage as number };
        } else {
          options = {
            width: width as number,
            height: height as number,
            lockAspectRatio,
          };
        }

        const { width: targetWidth, height: targetHeight } = calculateResizeDimensions(
          bitmap.width,
          bitmap.height,
          options
        );

        if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
          throw new Error(
            `Resulting dimensions (${targetWidth}x${targetHeight}) exceed maximum allowed (${MAX_DIMENSION}px)`
          );
        }

        const canvas = new OffscreenCanvas(targetWidth, targetHeight);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to create canvas');

        ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

        const blob = await canvasToBlob(canvas, { mimeType: 'image/png', quality: 0.92 });
        const filename = getOutputFilename(
          files[i].name,
          'png',
          `resized-${targetWidth}x${targetHeight}`
        );

        newResults.push({ blob, filename, originalName: files[i].name });
      }

      setResults(newResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
    } finally {
      setProcessing(false);
    }
  }, [files, bitmaps, mode, width, height, percentage, lockAspectRatio]);

  const handleDownload = useCallback((blob: Blob, filename: string) => {
    downloadBlob(blob, filename);
  }, []);

  const handleDownloadAll = useCallback(() => {
    results.forEach((r) => downloadBlob(r.blob, r.filename));
  }, [results]);

  const handleClear = useCallback(() => {
    setFiles([]);
    setBitmaps(new Map());
    setPreviews(new Map());
    setResults([]);
    setWidth('');
    setHeight('');
    setPercentage(100);
    setError(null);
    setOriginalDimensions(null);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
      bitmaps.forEach((bitmap) => bitmap.close());
    };
  }, []);

  const firstBitmap = bitmaps.get(0);
  const originalSize = firstBitmap ? formatFileSize(files[0]?.size || 0) : null;
  const estimatedSize =
    firstBitmap && width && height
      ? formatFileSize(estimateFileSize(width as number, height as number, 'image/png', 92))
      : null;

  return (
    <PageBackground variant="tool">
      <motion.main
        className="min-h-screen px-4 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mx-auto max-w-6xl">
          <header className="mb-8 flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-white">
              PixelKit
            </Link>
            <Link
              href="/"
              className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              ← All Tools
            </Link>
          </header>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <Panel variant="elevated" padding="md" className="sticky top-24">
                <PanelHeader title="Upload" />
                <Dropzone
                  onFiles={handleFiles}
                  multiple
                  maxFiles={10}
                  maxFileSize={MAX_FILE_SIZE}
                  id="resize-dropzone"
                  disabled={processing}
                />

                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h3 className="text-sm font-medium text-zinc-300">
                      Selected Files ({files.length})
                    </h3>
                    <ul className="max-h-40 space-y-1 overflow-y-auto">
                      {files.map((file, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between rounded bg-white/[0.03] px-2 py-1 text-sm text-zinc-300"
                        >
                          <span className="mr-2 truncate">{file.name}</span>
                          <span className="text-zinc-500">
                            {formatFileSize(file.size)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={handleClear}
                      variant="ghost"
                      size="sm"
                      fullWidth
                      disabled={processing}
                      className="text-red-400 hover:text-red-300"
                    >
                      Clear All
                    </Button>
                  </div>
                )}
              </Panel>
            </div>

            <div className="space-y-6 lg:col-span-2">
              <Panel variant="elevated" padding="lg">
                <PanelHeader title="Resize Settings" />

                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-zinc-300">
                    Mode
                  </label>
                  <div className="flex gap-4">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="resize-mode"
                        value="dimensions"
                        checked={mode === 'dimensions'}
                        onChange={() => handleModeChange('dimensions')}
                        className="h-4 w-4 accent-primary border-white/20"
                      />
                      <span className="text-sm text-zinc-200">Exact Dimensions</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="resize-mode"
                        value="percentage"
                        checked={mode === 'percentage'}
                        onChange={() => handleModeChange('percentage')}
                        className="h-4 w-4 accent-primary border-white/20"
                      />
                      <span className="text-sm text-zinc-200">Percentage</span>
                    </label>
                  </div>
                </div>

                {mode === 'dimensions' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                        Width (px)
                      </label>
                      <Input
                        type="number"
                        value={width}
                        onChange={(e) =>
                          handleDimensionChange('width', e.currentTarget.valueAsNumber || '')
                        }
                        min={1}
                        max={MAX_DIMENSION}
                        variant="glass"
                        disabled={processing}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                        Height (px)
                      </label>
                      <Input
                        type="number"
                        value={height}
                        onChange={(e) =>
                          handleDimensionChange('height', e.currentTarget.valueAsNumber || '')
                        }
                        min={1}
                        max={MAX_DIMENSION}
                        variant="glass"
                        disabled={processing}
                      />
                    </div>
                  </div>
                )}

                {mode === 'percentage' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                      Scale: {percentage}%
                    </label>
                    <div className="relative h-2 rounded-full bg-white/5">
                      <div
                        className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
                        style={{ width: `${((percentage as number) / 1000) * 100}%` }}
                      />
                      <input
                        type="range"
                        value={percentage as number}
                        onChange={(e) => handlePercentageChange(e.target.valueAsNumber)}
                        min={1}
                        max={1000}
                        className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:shadow-lg"
                        disabled={processing}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-[11px] text-zinc-500">
                      <span>1%</span>
                      <span>100%</span>
                      <span>1000%</span>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="lock-aspect"
                    checked={lockAspectRatio}
                    onChange={(e) => handleLockAspectRatioChange(e.target.checked)}
                    className="h-4 w-4 accent-primary rounded border-white/20"
                  />
                  <label
                    htmlFor="lock-aspect"
                    className="cursor-pointer text-sm text-zinc-300"
                  >
                    Lock aspect ratio
                  </label>
                </div>

                {firstBitmap && (
                  <div className="mt-4 space-y-1.5 border-t border-white/5 pt-4 text-sm">
                    <p className="text-zinc-400">
                      Original:{' '}
                      <span className="font-mono font-medium text-white">
                        {originalDimensions?.width} × {originalDimensions?.height}
                      </span>{' '}
                      • {originalSize}
                    </p>
                    {(width || percentage) && height && (
                      <p className="text-zinc-400">
                        Resized:{' '}
                        <span className="font-mono font-medium text-white">
                          {width} × {height}
                        </span>{' '}
                        • Est. {estimatedSize}
                      </p>
                    )}
                  </div>
                )}

                {error && (
                  <div
                    className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300"
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  <Button
                    onClick={handleProcess}
                    disabled={processing || files.length === 0 || (!width && !percentage)}
                    variant="primary"
                    size="md"
                    fullWidth
                  >
                    {processing ? 'Processing...' : 'Resize Images'}
                  </Button>
                  {results.length > 1 && (
                    <Button
                      onClick={handleDownloadAll}
                      variant="glass"
                      size="md"
                    >
                      Download All
                    </Button>
                  )}
                </div>
              </Panel>

              {results.length > 0 && (
                <Panel variant="elevated" padding="lg">
                  <PanelHeader title={`Results (${results.length})`} />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {results.map((result, index) => (
                      <div
                        key={index}
                        className="overflow-hidden rounded-lg border border-white/10"
                      >
                        <img
                          src={URL.createObjectURL(result.blob)}
                          alt={`Resized ${result.originalName}`}
                          className="h-48 w-full bg-zinc-900/50 object-contain"
                        />
                        <div className="space-y-2 p-3">
                          <p className="truncate text-sm font-medium text-white">
                            {result.filename}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {formatFileSize(result.blob.size)}
                          </p>
                          <Button
                            onClick={() => handleDownload(result.blob, result.filename)}
                            variant="primary"
                            size="sm"
                            fullWidth
                          >
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              )}
            </div>
          </div>
        </div>
      </motion.main>
    </PageBackground>
  );
}
