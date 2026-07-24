'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Dropzone } from '@/components/ui/Dropzone';
import { loadImageWithExif, downloadBlob, getOutputFilename, formatFileSize, drawCheckerboard } from '@/lib/canvas-utils';
import { backgroundRemovalTool } from '@/lib/tools/background-removal';

const MAX_FILE_SIZE = 100 * 1024 * 1024;

interface WorkerState {
  type: 'idle' | 'ready' | 'processing' | 'done' | 'error';
  progress?: number;
  result?: ImageBitmap;
  error?: string;
  resultBlobUrl?: string | null;
}

export default function RemoveBackgroundPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [bitmaps, setBitmaps] = useState<Map<number, ImageBitmap>>(new Map());
  const [previews, setPreviews] = useState<Map<number, string>>(new Map());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [workerState, setWorkerState] = useState<WorkerState>({ type: 'idle' });
  const [isClient, setIsClient] = useState(false);
  const [results, setResults] = useState<Array<{ blob: Blob; filename: string; originalName: string }>>([]);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [showCheckerboard, setShowCheckerboard] = useState(true);

  const workerRef = useRef<Worker | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resultBlobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let worker: Worker;
    let initTimeout: NodeJS.Timeout;

    try {
      worker = new Worker(new URL('../../lib/workers/bg-removal.worker.ts', import.meta.url), { type: 'module' });
      workerRef.current = worker;

      worker.onmessage = (event) => {
        if (initTimeout) clearTimeout(initTimeout);
        const { type } = event.data;
        if (type === 'ready') {
          setWorkerState({ type: 'ready' });
        } else if (type === 'progress') {
          setWorkerState((prev) => ({ ...prev, type: 'processing', progress: event.data.progress }));
        } else if (type === 'result') {
          const blob = event.data.blob as Blob;
          if (resultBlobUrlRef.current) {
            URL.revokeObjectURL(resultBlobUrlRef.current);
          }
          resultBlobUrlRef.current = URL.createObjectURL(blob);
          createImageBitmap(blob).then((imageBitmap) => {
            setWorkerState((prev) => ({ ...prev, type: 'done', result: imageBitmap, resultBlobUrl: resultBlobUrlRef.current }));
          });
        } else if (type === 'error') {
          setWorkerState({ type: 'error', error: event.data.message });
        }
      };

      worker.onerror = (error) => {
        if (initTimeout) clearTimeout(initTimeout);
        console.error('Worker error:', error);
        setTimeout(() => {
          setWorkerState({ type: 'error', error: 'Worker failed to initialize' });
        }, 0);
      };

      // Timeout for worker initialization
      initTimeout = setTimeout(() => {
        setTimeout(() => {
          setWorkerState({ type: 'error', error: 'Worker initialization timed out' });
        }, 0);
      }, 10000);
    } catch (error) {
      console.error('Failed to create worker:', error);
      setTimeout(() => {
        setWorkerState({ type: 'error', error: 'Failed to create background removal worker' });
      }, 0);
    }

    return () => {
      if (initTimeout) clearTimeout(initTimeout);
      if (worker) worker.terminate();
    };
  }, []);

  useEffect(() => {
    setTimeout(() => setIsClient(true), 0);
  }, []);

  const handleFiles = useCallback(async (newFiles: File[]) => {
    const validFiles = newFiles.filter((f) => f.size <= MAX_FILE_SIZE);
    if (validFiles.length !== newFiles.length) {
      alert('Some files exceed the 100MB limit and were skipped');
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
          setOriginalDimensions({ width: bitmap.width, height: bitmap.height });
          setOriginalSize(validFiles[i].size);
        }
      } catch (err) {
        console.error(`Failed to load ${validFiles[i].name}:`, err);
      }
    }

    setBitmaps(newBitmaps);
    setPreviews(newPreviews);
    setCurrentIndex(0);
  }, []);

  const handleProcess = useCallback(async () => {
    if (!workerRef.current || bitmaps.size === 0) return;

    const bitmap = bitmaps.get(currentIndex);
    if (!bitmap) return;

    setWorkerState({ type: 'processing', progress: 0 });

    // Convert ImageBitmap to Blob for the worker (removeBackground expects Blob/File)
    try {
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');
      ctx.drawImage(bitmap, 0, 0);
      const blob = await canvas.convertToBlob({ type: 'image/png' });

      // Transfer Blob to worker
      workerRef.current.postMessage({ type: 'remove', imageData: blob });
    } catch (err) {
      setWorkerState({ type: 'error', error: err instanceof Error ? err.message : 'Failed to prepare image' });
    }
  }, [bitmaps, currentIndex]);

  const handleDownload = useCallback(async () => {
    if (workerState.type !== 'done' || !workerState.resultBlobUrl) return;

    try {
      const response = await fetch(workerState.resultBlobUrl);
      const blob = await response.blob();
      const filename = getOutputFilename(files[currentIndex].name, 'png', 'no-bg');
      downloadBlob(blob, filename);
    } catch (err) {
      console.error('Download failed:', err);
    }
  }, [workerState, files, currentIndex]);

  const handleDownloadAll = useCallback(async () => {
    handleDownload();
  }, [handleDownload]);

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
    setOriginalSize(0);
    setWorkerState({ type: 'idle' });
    setCurrentIndex(0);
  }, []);

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
      bitmaps.forEach((bitmap) => bitmap.close());
      if (resultBlobUrlRef.current) {
        URL.revokeObjectURL(resultBlobUrlRef.current);
      }
    };
  }, []);

  // Draw checkerboard on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !showCheckerboard) return;

    const bitmap = workerState.result;
    if (!bitmap) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    drawCheckerboard(ctx, bitmap.width, bitmap.height);
  }, [workerState.result, showCheckerboard]);

  const currentPreview = previews.get(currentIndex);
  const currentFile = files[currentIndex];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
            PixelKit
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-blue-600 dark:hover:text-blue-400">
            ← All Tools
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upload</h2>
              <Dropzone
                onFiles={handleFiles}
                multiple
                maxFiles={10}
                maxFileSize={MAX_FILE_SIZE}
                id="bg-removal-dropzone"
                disabled={workerState.type === 'processing'}
              />

              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">Selected Files ({files.length})</h3>
                  <ul className="max-h-40 overflow-y-auto space-y-1">
                    {files.map((file, index) => (
                      <li
                        key={index}
                        className={`flex items-center justify-between text-sm px-2 py-1 rounded ${
                          index === currentIndex ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-gray-50 dark:bg-gray-700'
                        } cursor-pointer`}
                        onClick={() => {
                          setCurrentIndex(index);
                          if (workerState.type === 'done') {
                            setWorkerState({ type: 'ready' });
                          }
                        }}
                      >
                        <span className="truncate mr-2">{file.name}</span>
                        <span className="text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={handleClear}
                    className="w-full text-sm text-red-600 hover:text-red-700 dark:hover:text-red-400"
                    disabled={workerState.type === 'processing'}
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Background Removal</h2>

              {workerState.type === 'processing' && workerState.progress !== undefined && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Processing...</span>
                    <span>{Math.round(workerState.progress * 100)}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${workerState.progress * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    First run downloads the AI model (~10MB). Subsequent runs are faster.
                  </p>
                </div>
              )}

              {workerState.type === 'error' && (
                <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm" role="alert">
                  {workerState.error}
                </div>
              )}

              <div className="relative aspect-square max-w-md mx-auto bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                {currentPreview && (
                  <>
                    <img
                      src={currentPreview}
                      alt={currentFile?.name || 'Preview'}
                      className="absolute inset-0 w-full h-full object-contain"
                      style={{ opacity: workerState.type === 'done' ? 0.3 : 1 }}
                    />
                    {workerState.type === 'done' && (
                      <>
                        <canvas
                          ref={canvasRef}
                          className="absolute inset-0 w-full h-full object-contain"
                        />
                        {workerState.resultBlobUrl && (
                          <img
                            src={workerState.resultBlobUrl}
                            alt="Background removed"
                            className="absolute inset-0 w-full h-full object-contain"
                          />
                        )}
                      </>
                    )}
                  </>
                )}
                {!currentPreview && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <p>Upload an image to start</p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCheckerboard}
                    onChange={(e) => setShowCheckerboard(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  Show checkerboard
                </label>
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span>Background:</span>
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                  />
                </div>
              </div>

              {originalDimensions && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-center text-gray-600 dark:text-gray-400">
                  Original: <span className="font-mono font-medium text-gray-900 dark:text-white">
                    {originalDimensions.width} × {originalDimensions.height}
                  </span> • {formatFileSize(originalSize)}
                </div>
              )}

              <div className="mt-6 flex gap-3">
                {isClient && (
                  <>
                    <button
                      onClick={handleProcess}
                      disabled={workerState.type === 'processing' || files.length === 0 || workerState.type !== 'ready'}
                      className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {workerState.type === 'processing' ? 'Removing Background...' : 'Remove Background'}
                    </button>
                    {workerState.type === 'done' && (
                      <button
                        onClick={handleDownload}
                        className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        Download PNG
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}