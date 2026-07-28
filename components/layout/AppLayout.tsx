'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/design-system/utils';
import { Panel } from '@/components/ui/Panel';
import { Toolbar, ToolButton, ToolButtonWithTooltip } from '@/components/ui/Toolbar';
import { Sidebar, SidebarTrigger } from '@/components/ui/Sidebar';
import { Button } from '@/components/ui/Button';
import { PageBackground } from '@/components/background/BackgroundEffects';

interface AppLayoutProps {
  children: React.ReactNode;
  toolbar?: React.ReactNode;
  sidebar?: React.ReactNode;
  sidebarTitle?: string;
  sidebarSubtitle?: string;
  headerAction?: React.ReactNode;
  showToolbar?: boolean;
  showSidebar?: boolean;
  className?: string;
}

export const AppLayout = React.forwardRef<HTMLDivElement, AppLayoutProps>(
  (
    {
      children,
      toolbar,
      sidebar,
      sidebarTitle = 'Properties',
      sidebarSubtitle,
      headerAction,
      showToolbar = true,
      showSidebar = true,
      className,
    },
    ref
  ) => {
    const [sidebarOpen, setSidebarOpen] = React.useState(true);
    const [toolbarCollapsed, setToolbarCollapsed] = React.useState(false);

    return (
      <PageBackground variant="tool">
        <motion.div
          ref={ref}
          className={cn(
            'flex h-screen w-full overflow-hidden',
            className
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {/* Left Toolbar */}
          {showToolbar && (
            <AnimatePresence mode="wait">
              <motion.aside
                className={cn(
                  'flex flex-col shrink-0 transition-all duration-300 ease-out',
                  'bg-zinc-950/95 border-r border-white/10 backdrop-blur-xl',
                  'relative z-20'
                )}
                style={{
                  width: toolbarCollapsed ? '56px' : '72px',
                }}
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: toolbarCollapsed ? 56 : 72, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                <motion.div
                  className="flex h-16 items-center justify-center border-b border-white/10"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {!toolbarCollapsed && (
                    <Link
                      href="/"
                      className="flex items-center gap-2 text-lg font-bold text-white"
                      onClick={(e) => e.preventDefault()}
                    >
                      <motion.span
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60"
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <path d="M9 9h6v6H9z" />
                          <path d="M15 9v6" />
                          <path d="M9 12h6" />
                        </svg>
                      </motion.span>
                      <span>PixelKit</span>
                    </Link>
                  )}
                  {toolbarCollapsed && (
                    <Link
                      href="/"
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60"
                      onClick={(e) => e.preventDefault()}
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M9 9h6v6H9z" />
                        <path d="M15 9v6" />
                        <path d="M9 12h6" />
                      </svg>
                    </Link>
                  )}
                </motion.div>

                <motion.div
                  className="flex-1 overflow-y-auto p-1.5"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  {toolbar}
                </motion.div>

                <motion.div
                  className="p-1.5 border-t border-white/10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <ToolButtonWithTooltip
                    icon={
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                        <path d="M4 12h16" />
                      </svg>
                    }
                    label="Menu"
                    shortcut="M"
                    tooltipSide="right"
                    onClick={() => setToolbarCollapsed(!toolbarCollapsed)}
                  />
                </motion.div>
              </motion.aside>
            </AnimatePresence>
          )}

          {/* Main Canvas Area */}
          <motion.main
            className="flex-1 flex flex-col overflow-hidden relative min-w-0"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* Top Header */}
            <motion.header
              className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-6 bg-zinc-950/50 backdrop-blur-xl"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-lg font-bold text-white hover:opacity-80 transition-opacity"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M9 9h6v6H9z" />
                      <path d="M15 9v6" />
                      <path d="M9 12h6" />
                    </svg>
                  </span>
                  <span>PixelKit</span>
                </Link>
              </div>

              <div className="flex items-center gap-3">
                {headerAction}
                <motion.button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={sidebarOpen ? 'Hide properties' : 'Show properties'}
                >
                  <motion.svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    animate={{ rotate: sidebarOpen ? 0 : 180 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <path d="M15 18l-6-6 6-6" />
                  </motion.svg>
                </motion.button>
              </div>
            </motion.header>

            {/* Canvas Content */}
            <div className="flex-1 flex overflow-hidden relative">
              {children}
            </div>
          </motion.main>

          {/* Right Sidebar */}
          {showSidebar && (
            <AnimatePresence mode="wait">
              {sidebarOpen && (
                <Sidebar
                  title={sidebarTitle}
                  subtitle={sidebarSubtitle}
                  defaultOpen={true}
                  onClose={() => setSidebarOpen(false)}
                >
                  {sidebar}
                </Sidebar>
              )}
            </AnimatePresence>
          )}

          {/* Mobile Sidebar Trigger */}
          {showSidebar && !sidebarOpen && (
            <SidebarTrigger
              onClick={() => setSidebarOpen(true)}
              className="fixed right-4 bottom-4 z-50 md:hidden"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </SidebarTrigger>
          )}
        </motion.div>
      </PageBackground>
    );
  }
);
AppLayout.displayName = 'AppLayout';

export interface ToolLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  toolbar?: React.ReactNode;
  sidebar?: React.ReactNode;
  sidebarTitle?: string;
  headerAction?: React.ReactNode;
  className?: string;
}

export function ToolLayout({
  children,
  title,
  subtitle,
  toolbar,
  sidebar,
  sidebarTitle = 'Options',
  headerAction,
  className,
}: ToolLayoutProps) {
  return (
    <AppLayout
      toolbar={toolbar}
      sidebar={sidebar}
      sidebarTitle={sidebarTitle}
      sidebarSubtitle={subtitle}
      headerAction={headerAction}
      className={className}
    >
      <div className="flex h-full w-full flex-col">
        <div className="flex h-full w-full flex-1 overflow-hidden">
          <div className="flex w-full flex-1 items-center justify-center p-4 overflow-auto">
            <motion.div
              className="relative w-full max-w-6xl h-[calc(100vh-120px)]"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              {children}
</motion.div>
           </div>
         </div>
       </div>
     </AppLayout>
   );
 }
