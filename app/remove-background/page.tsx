'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Dropzone } from '@/components/ui/Dropzone';
import {
  loadImageWithExif,
  downloadBlob,
  getOutputFilename,
  formatFileSize,
  drawCheckerboard,
} from '@/lib/canvas-utils';
import { PageBackground } from '@/components/background/BackgroundEffects';
import { Button } from '@/components/ui/Button';
import { Panel, PanelHeader } from '@/components/ui/Panel';
import { BrushRetouch } from '@/components/tools/BrushRetouch';

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
  const [originalDimensions, setOriginalDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [showCheckerboard, setShowCheckerboard] = useState(true);

  const workerRef = useRef<Worker | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resultBlobUrlRef = useRef<string | null>(null);

  // Retouch mode state
  const [retouchMode, setRetouchMode] = useState(false);
  const [retouchResultBlob, setRetouchResultBlob] = useState<Blob | null>(null);

  useEffect(() => {
    let worker: Worker;
    let initTimeout: NodeJS.Timeout;

    try {
      worker = new Worker(new URL('../../lib/workers/bg-removal.worker.ts', import.meta.url), {
        type: 'module',
      });
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
          const blob = event.data.blob as Blob;
          if (resultBlobUrlRef.current) {
            URL.revokeObjectURL(resultBlobUrlRef.current);
          }
          resultBlobUrlRef.current = URL.createObjectURL(blob);
          createImageBitmap(blob).then((imageBitmap) => {
            setWorkerState((prev) => ({
              ...prev,
              type: 'done',
              result: imageBitmap,
              resultBlobUrl: resultBlobUrlRef.current,
            }));
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
      setWorkerState({
        type: 'error',
        error: err instanceof Error ? err.message : 'Failed to prepare image',
      });
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

  const handleEnterRetouch = useCallback(() => {
    if (workerState.type === 'done' && workerState.result) {
      setRetouchMode(true);
    }
  }, [workerState]);

  // Handle retouch result download
  useEffect(() => {
    if (retouchResultBlob) {
      const filename = getOutputFilename(files[currentIndex]?.name || 'image', 'png', 'retouched');
      downloadBlob(retouchResultBlob, filename);
      // Reset after download completes
      setTimeout(() => setRetouchResultBlob(null), 0);
    }
  }, [retouchResultBlob, files, currentIndex]);

  const handleClear = useCallback(() => {
    if (resultBlobUrlRef.current) {
      URL.revokeObjectURL(resultBlobUrlRef.current);
      resultBlobUrlRef.current = null;
    }
setFiles([]);
    setBitmaps(new Map());
    setPreviews(new Map());
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
                  id="bg-removal-dropzone"
                  disabled={workerState.type === 'processing'}
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
                          className={`flex items-center justify-between rounded px-2 py-1 text-sm cursor-pointer ${
                            index === currentIndex
                              ? 'bg-primary/10 text-primary'
                              : 'bg-white/[0.03] text-zinc-300'
                          }`}
                          onClick={() => {
                            setCurrentIndex(index);
                            if (workerState.type === 'done') {
                              setWorkerState({ type: 'ready' });
                            }
                          }}
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
                      disabled={workerState.type === 'processing'}
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
                <PanelHeader title="Background Removal" />

                {workerState.type === 'processing' && workerState.progress !== undefined && (
                  <div className="mb-6">
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-zinc-300">Processing...</span>
                      <span className="text-zinc-300">{Math.round(workerState.progress * 100)}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${workerState.progress * 100}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      First run downloads the AI model (~10MB). Subsequent runs are faster.
                    </p>
                  </div>
                )}

                {workerState.type === 'error' && (
                  <div
                    className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300"
                    role="alert"
                  >
                    {workerState.error}
                  </div>
                )}

                <div className="relative mx-auto aspect-square max-w-md overflow-hidden rounded-lg bg-white/[0.03]">
                  {currentPreview && (
                    <>
                      <img
                        src={currentPreview}
                        alt={currentFile?.name || 'Preview'}
                        className="absolute inset-0 h-full w-full object-contain"
                        style={{ opacity: workerState.type === 'done' ? 0.3 : 1 }}
                      />
                      {workerState.type === 'done' && (
                        <>
                          <canvas
                            ref={canvasRef}
                            className="absolute inset-0 h-full w-full object-contain"
                          />
                          {workerState.resultBlobUrl && (
                            <img
                              src={workerState.resultBlobUrl}
                              alt="Background removed"
                              className="absolute inset-0 h-full w-full object-contain"
                            />
                          )}
                        </>
                      )}
                    </>
                  )}
                  {!currentPreview && (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
                      <p>Upload an image to start</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-center gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      checked={showCheckerboard}
                      onChange={(e) => setShowCheckerboard(e.target.checked)}
                      className="h-4 w-4 accent-primary rounded border-white/20"
                    />
                    Show checkerboard
                  </label>
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <span>Background:</span>
                    <div className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 p-1">
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent"
                      />
                    </div>
                  </div>
                </div>

                {originalDimensions && (
                  <div className="mt-6 border-t border-white/5 pt-4 text-center text-sm text-zinc-400">
                    Original:{' '}
                    <span className="font-mono font-medium text-white">
                      {originalDimensions.width} × {originalDimensions.height}
                    </span>{' '}
                    • {formatFileSize(originalSize)}
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  {isClient && !retouchMode && (
                    <>
                      <Button
                        onClick={handleProcess}
                        disabled={
                          workerState.type === 'processing' ||
                          files.length === 0 ||
                          workerState.type !== 'ready'
                        }
                        variant="primary"
                        size="md"
                        fullWidth
                      >
                        {workerState.type === 'processing'
                          ? 'Removing Background...'
                          : 'Remove Background'}
                      </Button>
                      {workerState.type === 'done' && (
                        <>
                          <Button
                            onClick={handleEnterRetouch}
                            variant="secondary"
                            size="md"
                          >
                            Retouch
                          </Button>
                          <Button
                            onClick={handleDownload}
                            variant="glass"
                            size="md"
                          >
                            Download PNG
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </Panel>
            </div>
          </div>
        </div>
      </motion.main>

      {retouchMode && workerState.type === 'done' && workerState.result && (
        <BrushRetouch
          resultBitmap={workerState.result}
          originalPreviewUrl={previews.get(currentIndex) || ''}
          width={workerState.result.width}
          height={workerState.result.height}
          onApply={setRetouchResultBlob}
          onCancel={() => setRetouchMode(false)}
          backgroundColor={backgroundColor}
          showCheckerboard={showCheckerboard}
        />
      )}
    </PageBackground>
  );
}
