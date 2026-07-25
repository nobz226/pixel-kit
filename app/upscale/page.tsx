'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Dropzone } from '@/components/ui/Dropzone';
import {
  loadImageWithExif,
  downloadBlob,
  getOutputFilename,
  formatFileSize,
} from '@/lib/canvas-utils';
import { estimateOutputSize, getMaxInputDimensions, rgbToImageBitmap } from '@/lib/tools/upscale';

const MAX_FILE_SIZE = 100 * 1024 * 1024;

interface WorkerState {
  type: 'idle' | 'ready' | 'processing' | 'done' | 'error';
  progress?: number;
  result?: ImageBitmap;
  error?: string;
  resultBlobUrl?: string | null;
}

function imageBitmapToRgbData(bitmap: ImageBitmap): {
  data: Uint8Array;
  shape: [number, number, number];
} {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');
  ctx.drawImage(bitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
  const rgb = new Uint8Array(bitmap.width * bitmap.height * 3);
  for (let i = 0; i < bitmap.width * bitmap.height; i++) {
    rgb[i * 3] = imageData.data[i * 4];
    rgb[i * 3 + 1] = imageData.data[i * 4 + 1];
    rgb[i * 3 + 2] = imageData.data[i * 4 + 2];
  }
  return { data: rgb, shape: [bitmap.height, bitmap.width, 3] };
}

export default function UpscalePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [bitmaps, setBitmaps] = useState<Map<number, ImageBitmap>>(new Map());
  const [previews, setPreviews] = useState<Map<number, string>>(new Map());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [workerState, setWorkerState] = useState<WorkerState>({ type: 'idle' });
  const [scale, setScale] = useState<2 | 4>(2);
  const [isClient, setIsClient] = useState(false);
  const [results, setResults] = useState<
    Array<{ blob: Blob; filename: string; originalName: string }>
  >([]);
  const [originalDimensions, setOriginalDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const resultBlobUrlRef = useRef<string | null>(null);

  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    let worker: Worker;
    let initTimeout: NodeJS.Timeout;

    try {
      worker = new Worker(
        new URL('../../lib/workers/upscale.worker.ts', import.meta.url),
        { type: 'module' }
      );
      workerRef.current = worker;

      worker.onmessage = (event) => {
        if (initTimeout) clearTimeout(initTimeout);
        const { type } = event.data;
        if (type === 'ready') {
          setWorkerState({ type: 'ready' });
        } else if (type === 'progress') {
          setWorkerState((prev) => ({
            ...prev,
            type: 'processing',
            progress: event.data.progress,
          }));
        } else if (type === 'result') {
          const { data, shape } = event.data;
          const [height, width] = shape;
          rgbToImageBitmap(data, width, height).then((imageBitmap) => {
            const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(imageBitmap, 0, 0);
            canvas.convertToBlob({ type: 'image/png' }).then((blob) => {
              if (resultBlobUrlRef.current) {
                URL.revokeObjectURL(resultBlobUrlRef.current);
              }
              resultBlobUrlRef.current = URL.createObjectURL(blob);
              setWorkerState((prev) => ({
                ...prev,
                type: 'done',
                result: imageBitmap,
                resultBlobUrl: resultBlobUrlRef.current,
              }));
            });
          });
        } else if (type === 'error') {
          setWorkerState({ type: 'error', error: event.data.message });
        }
      };

      worker.onerror = () => {
        if (initTimeout) clearTimeout(initTimeout);
        setWorkerState({ type: 'error', error: 'Worker failed to initialize' });
      };

      initTimeout = setTimeout(() => {
        setWorkerState({ type: 'error', error: 'Worker initialization timed out' });
      }, 15000);
    } catch {
      setTimeout(() => {
        setWorkerState({ type: 'error', error: 'Failed to create upscaling worker' });
      }, 0);
    }

    return () => {
      if (initTimeout) clearTimeout(initTimeout);
      if (worker) {
        worker.postMessage({ type: 'terminate' });
        worker.terminate();
      }
    };
  }, []);

  useEffect(() => {
    setTimeout(() => setIsClient(true), 0);
  }, []);

  const handleFiles = useCallback(async (newFiles: File[]) => {
    const validFiles = newFiles.filter((f) => f.size <= MAX_FILE_SIZE);
    setFiles(validFiles);
    setResults([]);
    setCurrentIndex(0);

    const newBitmaps = new Map<number, ImageBitmap>();
    const newPreviews = new Map<number, string>();

    for (let i = 0; i < validFiles.length; i++) {
      try {
        const bitmap = await loadImageWithExif(validFiles[i]);
        newBitmaps.set(i, bitmap);
        const previewUrl = URL.createObjectURL(validFiles[i]);
        newPreviews.set(i, previewUrl);

        if (i === 0) {
          setOriginalDimensions({ width: bitmap.width, height: bitmap.height });
        }
      } catch (err) {
        console.error(`Failed to load ${validFiles[i].name}:`, err);
      }
    }

    setBitmaps(newBitmaps);
    setPreviews(newPreviews);
  }, []);

  const handleProcess = useCallback(async () => {
    if (!workerRef.current || bitmaps.size === 0) return;

    const bitmap = bitmaps.get(currentIndex);
    if (!bitmap) return;

    const maxInput = getMaxInputDimensions(scale);
    if (bitmap.width > maxInput.width || bitmap.height > maxInput.height) {
      setWorkerState({
        type: 'error',
        error: `Image too large for ${scale}x upscaling. Maximum input: ${maxInput.width}×${maxInput.height}px. Your image: ${bitmap.width}×${bitmap.height}px.`,
      });
      return;
    }

    setWorkerState({ type: 'processing', progress: 0 });

    try {
      const { data, shape } = imageBitmapToRgbData(bitmap);
      const buffer = data.buffer as ArrayBuffer;
      workerRef.current.postMessage(
        { type: 'upscale', imageData: data, shape, scale },
        { transfer: [buffer] }
      );
    } catch (err) {
      setWorkerState({
        type: 'error',
        error: err instanceof Error ? err.message : 'Failed to prepare image',
      });
    }
  }, [bitmaps, currentIndex, scale]);

  const handleDownload = useCallback(async () => {
    if (workerState.type !== 'done' || !workerState.resultBlobUrl) return;

    try {
      const response = await fetch(workerState.resultBlobUrl);
      const blob = await response.blob();
      const filename = getOutputFilename(
        files[currentIndex].name,
        'png',
        `${scale}x-upscale`
      );
      downloadBlob(blob, filename);
    } catch (err) {
      console.error('Download failed:', err);
    }
  }, [workerState, files, currentIndex, scale]);

  const handleClear = useCallback(() => {
    if (resultBlobUrlRef.current) {
      URL.revokeObjectURL(resultBlobUrlRef.current);
      resultBlobUrlRef.current = null;
    }
    setFiles([]);
    setBitmaps(new Map());
    setPreviews(new Map());
    setResults([]);
    setOriginalDimensions(null);
    setWorkerState({ type: 'idle' });
    setCurrentIndex(0);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
      bitmaps.forEach((b) => b.close());
      if (resultBlobUrlRef.current) {
        URL.revokeObjectURL(resultBlobUrlRef.current);
      }
    };
  }, []);

  const currentPreview = previews.get(currentIndex);
  const currentFile = files[currentIndex];
  const outputDims = originalDimensions
    ? estimateOutputSize(originalDimensions.width, originalDimensions.height, scale)
    : null;
  const maxInput = getMaxInputDimensions(scale);
  const exceedsMax =
    originalDimensions &&
    (originalDimensions.width > maxInput.width || originalDimensions.height > maxInput.height);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
            PixelKit
          </Link>
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
          >
            ← All Tools
          </Link>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Upload</h2>
              <Dropzone
                onFiles={handleFiles}
                multiple={false}
                maxFiles={1}
                maxFileSize={MAX_FILE_SIZE}
                id="upscale-dropzone"
                disabled={workerState.type === 'processing'}
              />

              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Selected File
                  </h3>
                  <ul className="max-h-40 space-y-1 overflow-y-auto">
                    {files.map((file, index) => (
                      <li
                        key={index}
                        className={`flex items-center justify-between rounded px-2 py-1 text-sm ${
                          index === currentIndex
                            ? 'bg-blue-50 dark:bg-blue-900/30'
                            : 'bg-gray-50 dark:bg-gray-700'
                        } cursor-pointer`}
                        onClick={() => {
                          setCurrentIndex(index);
                          if (workerState.type === 'done') {
                            setWorkerState({ type: 'ready' });
                          }
                        }}
                      >
                        <span className="mr-2 truncate">{file.name}</span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {formatFileSize(file.size)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={handleClear}
                    className="w-full text-sm text-red-600 hover:text-red-700 dark:hover:text-red-400"
                    disabled={workerState.type === 'processing'}
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Upscale Settings
              </h2>

              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Scale Factor
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setScale(2)}
                    className={`rounded-lg border px-4 py-3 text-center transition-colors ${
                      scale === 2
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                    disabled={workerState.type === 'processing'}
                  >
                    <div className="text-lg font-bold">2×</div>
                    <div className="text-xs opacity-80">4× pixels • Fast</div>
                  </button>
                  <button
                    onClick={() => setScale(4)}
                    className={`rounded-lg border px-4 py-3 text-center transition-colors ${
                      scale === 4
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                    disabled={workerState.type === 'processing'}
                  >
                    <div className="text-lg font-bold">4×</div>
                    <div className="text-xs opacity-80">16× pixels • Slower</div>
                  </button>
                </div>
              </div>

              {originalDimensions && (
                <div className="mb-6 space-y-2 border-t border-gray-200 pt-4 text-sm dark:border-gray-700">
                  <p className="text-gray-600 dark:text-gray-400">
                    Original:{' '}
                    <span className="font-mono font-medium text-gray-900 dark:text-white">
                      {originalDimensions.width} × {originalDimensions.height}
                    </span>{' '}
                    • {formatFileSize(files[currentIndex]?.size || 0)}
                  </p>
                  {outputDims && (
                    <p className="text-gray-600 dark:text-gray-400">
                      Output:{' '}
                      <span className="font-mono font-medium text-gray-900 dark:text-white">
                        {outputDims.width} × {outputDims.height}
                      </span>
                    </p>
                  )}
                  {exceedsMax && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                      Image exceeds the recommended maximum input size for {scale}× scaling (
                      {maxInput.width}×{maxInput.height}px). Processing may fail or be very slow.
                    </div>
                  )}
                </div>
              )}

              {workerState.type === 'processing' && (
                <div className="mb-6">
                  <div className="mb-1 flex justify-between text-sm">
                    <span>Upscaling...</span>
                    {workerState.progress !== undefined && (
                      <span>{Math.round(workerState.progress * 100)}%</span>
                    )}
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{
                        width: `${
                          workerState.progress !== undefined
                            ? workerState.progress * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Processing patches with AI model. First run downloads model weights (~1MB).
                  </p>
                </div>
              )}

              {workerState.type === 'error' && (
                <div
                  className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
                  role="alert"
                >
                  {workerState.error}
                </div>
              )}

              <div
                ref={containerRef}
                className="relative mx-auto mb-6 max-w-md overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 select-none"
                style={{ aspectRatio: originalDimensions ? `${originalDimensions.width}/${originalDimensions.height}` : '1', touchAction: 'none' }}
                onMouseDown={(e) => {
                  if (!containerRef.current || workerState.type !== 'done') return;
                  isDragging.current = true;
                  const rect = containerRef.current.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  setSliderPosition(Math.max(0, Math.min(100, x)));
                }}
                onMouseMove={(e) => {
                  if (!isDragging.current || !containerRef.current) return;
                  const rect = containerRef.current.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  setSliderPosition(Math.max(0, Math.min(100, x)));
                }}
                onMouseUp={() => { isDragging.current = false; }}
                onMouseLeave={() => { isDragging.current = false; }}
                onTouchStart={(e) => {
                  if (!containerRef.current || workerState.type !== 'done') return;
                  isDragging.current = true;
                  const rect = containerRef.current.getBoundingClientRect();
                  const x = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
                  setSliderPosition(Math.max(0, Math.min(100, x)));
                }}
                onTouchMove={(e) => {
                  if (!isDragging.current || !containerRef.current) return;
                  const rect = containerRef.current.getBoundingClientRect();
                  const x = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
                  setSliderPosition(Math.max(0, Math.min(100, x)));
                }}
                onTouchEnd={() => { isDragging.current = false; }}
              >
                {currentPreview && (
                  <div className="relative h-full w-full">
                    <img
                      src={currentPreview}
                      alt={currentFile?.name || 'Preview'}
                      className="pointer-events-none block h-full w-full"
                      style={{ objectFit: 'contain' }}
                    />
                    {workerState.type === 'done' && workerState.resultBlobUrl && (
                      <img
                        src={workerState.resultBlobUrl}
                        alt="Upscaled result"
                        className="pointer-events-none absolute inset-0 block h-full w-full"
                        style={{
                          objectFit: 'contain',
                          clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)`,
                        }}
                      />
                    )}
                    <div className="pointer-events-none absolute left-2 top-2 z-20 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
                      Original
                    </div>
                    {workerState.type === 'done' && workerState.resultBlobUrl && (
                      <div className="pointer-events-none absolute right-2 top-2 z-20 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
                        Upscaled
                      </div>
                    )}
                    {workerState.type === 'done' && (
                      <div
                        className="absolute inset-y-0 z-10 w-0.5 cursor-col-resize bg-white shadow-md"
                        style={{ left: `${sliderPosition}%` }}
                      >
                        <div className="absolute -left-3 -translate-y-1/2 top-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md">
                          <svg viewBox="0 0 24 24" className="h-4 w-4 text-gray-600" fill="currentColor">
                            <path d="M8 5l-5 7 5 7" />
                            <path d="M16 5l5 7-5 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {!currentPreview && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <p>Upload an image to start</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                {isClient && (
                  <>
                    <button
                      onClick={handleProcess}
                      disabled={
                        workerState.type === 'processing' ||
                        files.length === 0 ||
                        workerState.type !== 'ready'
                      }
                      className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {workerState.type === 'processing'
                        ? 'Upscaling...'
                        : `Upscale ${scale}×`}
                    </button>
                    {workerState.type === 'done' && (
                      <>
                        <button
                          onClick={handleDownload}
                          className="rounded-lg bg-gray-100 px-4 py-3 font-medium text-gray-900 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                        >
                          Download PNG
                        </button>
                        <button
                          onClick={() => setIsFullscreen(true)}
                          className="rounded-lg bg-gray-100 px-4 py-3 font-medium text-gray-900 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                        >
                          Fullscreen
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {results.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                  Results ({results.length})
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <img
                        src={URL.createObjectURL(result.blob)}
                        alt={`Upscaled ${result.originalName}`}
                        className="h-48 w-full bg-gray-100 object-contain dark:bg-gray-700"
                      />
                      <div className="space-y-2 p-3">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                          {result.filename}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(result.blob.size)}
                        </p>
                        <button
                          onClick={() => downloadBlob(result.blob, result.filename)}
                          className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-700"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-gray-400">
              {currentFile?.name} — Drag to compare
            </span>
            <button
              onClick={() => setIsFullscreen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center p-4">
            <div
              className="relative h-full w-full max-w-full max-h-full overflow-hidden select-none"
              style={{ aspectRatio: originalDimensions ? `${originalDimensions.width}/${originalDimensions.height}` : '1', maxHeight: '100%', touchAction: 'none' }}
              onMouseDown={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                setSliderPosition(Math.max(0, Math.min(100, x)));
                isDragging.current = true;
              }}
              onMouseMove={(e) => {
                if (!isDragging.current) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                setSliderPosition(Math.max(0, Math.min(100, x)));
              }}
              onMouseUp={() => { isDragging.current = false; }}
              onMouseLeave={() => { isDragging.current = false; }}
              onTouchStart={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
                setSliderPosition(Math.max(0, Math.min(100, x)));
                isDragging.current = true;
              }}
              onTouchMove={(e) => {
                if (!isDragging.current) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
                setSliderPosition(Math.max(0, Math.min(100, x)));
              }}
              onTouchEnd={() => { isDragging.current = false; }}
            >
              {currentPreview && (
                <>
                  <img
                    src={currentPreview}
                    alt="Original"
                    className="pointer-events-none absolute inset-0 h-full w-full"
                    style={{ objectFit: 'contain' }}
                  />
                  {workerState.resultBlobUrl && (
                    <img
                      src={workerState.resultBlobUrl}
                      alt="Upscaled"
                      className="pointer-events-none absolute inset-0 h-full w-full"
                      style={{
                        objectFit: 'contain',
                        clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)`,
                      }}
                    />
                  )}
                  <div className="pointer-events-none absolute left-2 top-2 z-20 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
                    Original
                  </div>
                  {workerState.resultBlobUrl && (
                    <div className="pointer-events-none absolute right-2 top-2 z-20 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
                      Upscaled
                    </div>
                  )}
                  <div
                    className="absolute inset-y-0 z-10 w-0.5 cursor-col-resize bg-white shadow-md"
                    style={{ left: `${sliderPosition}%` }}
                  >
                    <div className="absolute -left-3 -translate-y-1/2 top-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md">
                      <svg viewBox="0 0 24 24" className="h-4 w-4 text-gray-600" fill="currentColor">
                        <path d="M8 5l-5 7 5 7" />
                        <path d="M16 5l5 7-5 7" />
                      </svg>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
