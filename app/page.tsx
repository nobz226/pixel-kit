'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { PageBackground, FloatingOrbs } from '@/components/background/BackgroundEffects';
import { Button } from '@/components/ui/Button';

const tools = [
  {
    name: 'Resize',
    href: '/resize',
    description: 'Exact pixel dimensions, percentage scaling, aspect ratio lock, live preview',
    phase: 'Phase 1',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
      </svg>
    ),
  },
  {
    name: 'Crop',
    href: '/crop',
    description: 'Freeform drag-to-crop, fixed-ratio presets (1:1, 4:3, 16:9, 3:2), numeric fine-tuning',
    phase: 'Phase 1',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    ),
  },
  {
    name: 'Convert',
    href: '/convert',
    description: 'JPEG, PNG, WebP, AVIF output. Transparency handling with background color picker',
    phase: 'Phase 1',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    name: 'Compress',
    href: '/compress',
    description: 'Quality slider (0-100), live file-size estimate, before/after visual comparison',
    phase: 'Phase 1',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0021 6.96V19.04a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    name: 'Remove Background',
    href: '/remove-background',
    description: 'One-click subject segmentation, transparent PNG output, checkerboard preview, background replacement',
    phase: 'Phase 2',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    ),
  },
  {
    name: 'Upscale',
    href: '/upscale',
    description: '2x/4x AI super-resolution, model selection for photos/art/screenshots, large image handling',
    phase: 'Phase 3',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

const principles = [
  { title: 'No Account', desc: 'Start editing immediately \u2014 no sign-up required', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { title: 'No Uploads', desc: 'Images never leave your device \u2014 true privacy by architecture', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { title: 'No Watermarks', desc: 'Your images, your output \u2014 clean exports every time', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
  { title: 'No Limits', desc: 'No file size games, no batch limits, no artificial restrictions', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
];

const tech = ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS', 'Canvas API', 'Web Workers', 'ONNX Runtime', 'TensorFlow.js'];

export default function HomePage() {
  return (
    <PageBackground variant="radial">

      {/* Hero */}
      <motion.section
        className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <FloatingOrbs count={3} />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="mb-6"
        >
          <motion.span
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary backdrop-blur-xl"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            Free &amp; Private
          </motion.span>
        </motion.div>

        <motion.h1
          className="mb-4 text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <span className="bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-transparent">
            PixelKit
          </span>
        </motion.h1>

        <motion.p
          className="mx-auto mb-10 max-w-2xl text-lg text-zinc-400 sm:text-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Free, private, client-side image editing. Resize, crop, convert, compress, remove backgrounds, and upscale \u2014 all in your browser. No uploads, no accounts, no watermarks.
        </motion.p>

        <motion.div
          className="flex flex-col gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <Link href="/resize">
            <Button variant="primary" size="lg">
              Try Resize Tool
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
          </Link>
          <a href="#tools">
            <Button variant="ghost" size="lg">
              View All Tools
            </Button>
          </a>
        </motion.div>
      </motion.section>

      {/* Principles */}
      <motion.section
        className="relative z-10 border-t border-white/5 px-4 py-24 sm:px-6 lg:px-8"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="mx-auto max-w-6xl">
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="mb-3 text-3xl font-bold text-white sm:text-4xl">
              Built Different
            </h2>
            <p className="text-zinc-400">
              Privacy-first architecture means your images never leave your device.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {principles.map((p, i) => (
              <motion.div
                key={p.title}
                className="group relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.03] p-6 backdrop-blur-xl transition-all duration-300 hover:border-white/10 hover:bg-white/[0.05]"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={p.icon} />
                  </svg>
                </div>
                <h3 className="mb-2 text-base font-semibold text-white">{p.title}</h3>
                <p className="text-sm text-zinc-400">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Tools Grid */}
      <motion.section
        id="tools"
        className="relative z-10 border-t border-white/5 px-4 py-24 sm:px-6 lg:px-8"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="mx-auto max-w-6xl">
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="mb-3 text-3xl font-bold text-white sm:text-4xl">
              Tools
            </h2>
            <p className="text-zinc-400">
              Everything you need to edit images, right in your browser.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool, i) => (
              <Link key={tool.name} href={tool.href}>
                <motion.div
                  className="group relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.03] p-6 backdrop-blur-xl transition-all duration-300 hover:border-primary/20 hover:bg-primary/[0.02] hover:shadow-[0_0_30px_rgba(0,212,170,0.05)]"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110 group-hover:bg-primary/20">
                      {tool.icon}
                    </div>
                    <span className="rounded-full border border-white/5 bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-zinc-500 backdrop-blur-xl">
                      {tool.phase}
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-white transition-colors group-hover:text-primary">
                    {tool.name}
                  </h3>
                  <p className="text-sm text-zinc-400">{tool.description}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Tech Stack */}
      <motion.section
        className="relative z-10 border-t border-white/5 px-4 py-24 sm:px-6 lg:px-8"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="mx-auto max-w-4xl text-center">
          <motion.h2
            className="mb-8 text-2xl font-bold text-white"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Built With
          </motion.h2>
          <motion.div
            className="flex flex-wrap justify-center gap-3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {tech.map((t, i) => (
              <motion.span
                key={t}
                className="rounded-full border border-white/5 bg-white/[0.03] px-4 py-2 text-sm text-zinc-400 backdrop-blur-xl transition-colors hover:border-white/10 hover:text-zinc-200"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.05, duration: 0.3 }}
              >
                {t}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer
        className="relative z-10 border-t border-white/5 px-4 py-12 sm:px-6 lg:px-8"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="mx-auto max-w-6xl text-center">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60">
            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 9h6v6H9z" />
              <path d="M15 9v6" />
              <path d="M9 12h6" />
            </svg>
          </div>
          <p className="text-sm text-zinc-500">
            Open source \u2014 built with AI assistance. No tracking, no analytics, no nonsense.
          </p>
          <div className="mt-6 flex justify-center gap-6">
            <Link href="https://github.com" className="text-sm text-zinc-500 transition-colors hover:text-zinc-300">
              GitHub
            </Link>
            <a href="#license" className="text-sm text-zinc-500 transition-colors hover:text-zinc-300">
              License
            </a>
          </div>
        </div>
      </motion.footer>
    </PageBackground>
  );
}