'use client';
import React from 'react';
interface TopHeaderProps {
    title: string;
    actions?: React.ReactNode;
}
export default function TopHeader({ title, actions }: TopHeaderProps) {
    return (<header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      {actions && (<div className="flex items-center gap-3">{actions}</div>)}
    </header>);
}
