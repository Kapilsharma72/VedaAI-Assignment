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
export default function AppLayout({ children, title, actions }: AppLayoutProps) {
    return (<div className="flex h-screen overflow-hidden bg-[#f8fafc]">

      <Sidebar />


      <div className="flex flex-1 flex-col overflow-hidden">

        {title !== undefined && <TopHeader title={title} actions={actions}/>}


        <main className="flex-1 overflow-y-auto bg-[#f8fafc]">
          <AnimatePresence mode="wait">
            <motion.div key={title ?? 'page'} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: 'easeInOut' }} className="h-full">
              {children}
            </motion.div>
          </AnimatePresence>
        </main>


        <BottomTabBar />
      </div>
    </div>);
}
