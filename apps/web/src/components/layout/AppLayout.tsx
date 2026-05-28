'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import BottomTabBar from './BottomTabBar';
import TopHeader from './TopHeader';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
}

/**
 * AppLayout — root shell for all authenticated pages.
 *
 * Breakpoint behaviour:
 *  - md+ (≥ 768 px): Sidebar visible on the left, BottomTabBar hidden
 *  - < md (< 768 px): Sidebar hidden, BottomTabBar fixed at the bottom
 *
 * Page transitions use Framer Motion fade with a 250 ms duration (≤ 300 ms).
 */
export default function AppLayout({ children, title, actions }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      {/* Sidebar — visible on md+ only */}
      <Sidebar />

      {/* Main content column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header — rendered when a title is provided */}
        {title !== undefined && <TopHeader title={title} actions={actions} />}

        {/* Page content with Framer Motion transition */}
        <main className="flex-1 overflow-y-auto bg-[#f8fafc]">
          <AnimatePresence mode="wait">
            <motion.div
              key={title ?? 'page'}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom tab bar — visible on < md only */}
        <BottomTabBar />
      </div>
    </div>
  );
}
