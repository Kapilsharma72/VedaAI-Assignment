'use client';

import React from 'react';

interface TopHeaderProps {
  /** Page title rendered as an h1 */
  title: string;
  /** Optional action buttons rendered to the right of the title (e.g. "New Assignment") */
  actions?: React.ReactNode;
}

/**
 * TopHeader — page-level header rendered inside AppLayout above the content area.
 *
 * Renders the page title (h1) on the left and any contextual action buttons on the right.
 * Sits above the scrollable main content and stays visible while the user scrolls.
 */
export default function TopHeader({ title, actions }: TopHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      {actions && (
        <div className="flex items-center gap-3">{actions}</div>
      )}
    </header>
  );
}
