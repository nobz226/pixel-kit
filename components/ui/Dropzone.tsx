'use client';

import { useCallback, useRef, useState, DragEvent, ChangeEvent, ClipboardEvent } from 'react';

export interface DropzoneProps {
  onFiles: (files: File[]) => void;
  accept?: string[];
  maxFiles?: number;
  maxFileSize?: number;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const DEFAULT_ACCEPT = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/bmp',
  'image/tiff',
];
const DEFAULT_MAX_FILE_SIZE = 100 * 1024 * 1024;

export function Dropzone({
  onFiles,
  accept = DEFAULT_ACCEPT,
  maxFiles = 10,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  multiple = true,
  disabled = false,
  className = '',
  id,
}: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (
        !accept.some(
          (type) =>
            file.type === type ||
            (type.endsWith('/*') && file.type.startsWith(type.replace('/*', '/')))
        )
      ) {
        return `Unsupported file type: ${file.type || file.name}. Allowed: ${accept.join(', ')}`;
      }
      if (file.size > maxFileSize) {
        return `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: ${maxFileSize / 1024 / 1024}MB`;
      }
      return null;
    },
    [accept, maxFileSize]
  );

  const validateImageFile = useCallback(
    async (file: File): Promise<string | null> => {
      const typeError = validateFile(file);
      if (typeError) return typeError;

      try {
        const bitmap = await createImageBitmap(file);
        bitmap.close();
        return null;
      } catch {
        return `Corrupted or unreadable image file: ${file.name}`;
      }
    },
    [validateFile]
  );

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      if (disabled) return;

      const fileArray = Array.from(files);
      if (fileArray.length > maxFiles) {
        setError(`Too many files. Maximum: ${maxFiles}`);
        return;
      }

      const validFiles: File[] = [];
      const errors: string[] = [];

      for (const file of fileArray) {
        const error = await validateImageFile(file);
        if (error) {
          errors.push(error);
        } else {
          validFiles.push(file);
        }
      }

      if (errors.length > 0) {
        setError(errors.join('; '));
      } else {
        setError(null);
      }

      if (validFiles.length > 0) {
        onFiles(validFiles);
      }
    },
    [disabled, maxFiles, onFiles, validateImageFile]
  );

  const handleDragOver = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setIsDragging(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
      e.target.value = '';
    },
    [handleFiles]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      if (disabled) return;
      const items = e.clipboardData.items;
      const files: File[] = [];
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        handleFiles(files);
      }
    },
    [disabled, handleFiles]
  );

  const acceptAttr = accept.join(',');

  return (
    <div
      ref={dropzoneRef}
      className={`relative rounded-xl border-2 transition-all duration-200 ${
        disabled
          ? 'cursor-not-allowed border-gray-200 opacity-50 dark:border-gray-700'
          : isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-200 hover:border-blue-400 dark:border-gray-700'
      } ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      onPaste={handlePaste}
      tabIndex={0}
      role="button"
      aria-label="Dropzone for image upload"
      aria-describedby={error ? `${id}-error` : undefined}
    >
      <input
        ref={fileInputRef}
        type="file"
        id={id}
        accept={acceptAttr}
        multiple={multiple}
        onChange={handleFileChange}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        disabled={disabled}
        aria-hidden="true"
      />

      <div className="flex flex-col items-center justify-center p-8 text-center">
        <svg
          className="mb-4 h-12 w-12 text-gray-400 dark:text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="text-lg font-medium text-gray-900 dark:text-white">
          {multiple
            ? 'Drag & drop images here, or click to browse'
            : 'Drag & drop an image here, or click to browse'}
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Supports: {accept.map((a) => a.replace('image/', '')).join(', ')} • Max{' '}
          {maxFileSize / 1024 / 1024}MB per file
          {multiple ? ` • Up to ${maxFiles} files` : ''}
        </p>
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
          Or press{' '}
          <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            Ctrl/Cmd + V
          </kbd>{' '}
          to paste from clipboard
        </p>
      </div>

      {error && (
        <div
          id={`${id}-error`}
          className="absolute right-0 bottom-full left-0 mb-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
          role="alert"
        >
          {error}
        </div>
      )}
    </div>
  );
}
