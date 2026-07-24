import Link from 'next/link';

export default function CompressPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-16 dark:bg-gray-900">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">Compress</h1>
        <p className="mx-auto mb-8 max-w-2xl text-gray-600 dark:text-gray-300">
          Adjustable quality slider with live file-size estimate and before/after comparison. Built
          with Canvas API. Coming in Phase 1.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
        >
          Back to Tools
        </Link>
      </div>
    </main>
  );
}
