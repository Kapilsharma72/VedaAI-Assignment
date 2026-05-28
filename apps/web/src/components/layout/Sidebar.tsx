'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useAssignmentsStore } from '@/store/assignments.store';
function HomeIcon({ className }: {
    className?: string;
}) {
    return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/>
    </svg>);
}
function AssignmentsIcon({ className }: {
    className?: string;
}) {
    return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"/>
    </svg>);
}
function LibraryIcon({ className }: {
    className?: string;
}) {
    return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"/>
    </svg>);
}
function AIToolkitIcon({ className }: {
    className?: string;
}) {
    return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"/>
    </svg>);
}
function LogoutIcon({ className }: {
    className?: string;
}) {
    return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"/>
    </svg>);
}
interface NavItem {
    label: string;
    href: string;
    icon: React.ComponentType<{
        className?: string;
    }>;
    showBadge?: boolean;
}
const navItems: NavItem[] = [
    { label: 'Home', href: '/', icon: HomeIcon },
    { label: 'Assignments', href: '/assignments', icon: AssignmentsIcon, showBadge: true },
    { label: 'Library', href: '/library', icon: LibraryIcon },
    { label: 'AI Toolkit', href: '/ai-toolkit', icon: AIToolkitIcon },
];
export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const logout = useAuthStore((s) => s.logout);
    const assignmentCount = useAssignmentsStore((s) => s.assignments.length);
    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };
    return (<aside className="hidden md:flex w-64 flex-shrink-0 flex-col bg-[#1a1f2e] text-white">

      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6366f1]">
          <AIToolkitIcon className="h-5 w-5 text-white"/>
        </div>
        <span className="text-lg font-bold tracking-tight">VedaAI</span>
      </div>


      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Main navigation">
        {navItems.map(({ label, href, icon: Icon, showBadge }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (<Link key={href} href={href} aria-current={isActive ? 'page' : undefined} className={[
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                        ? 'bg-[#6366f1] text-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white',
                ].join(' ')}>
              <Icon className="h-5 w-5 flex-shrink-0"/>
              <span className="flex-1">{label}</span>
              {showBadge && assignmentCount > 0 && (<span className="ml-auto flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#6366f1] px-1.5 text-xs font-semibold text-white">
                  {assignmentCount > 99 ? '99+' : assignmentCount}
                </span>)}
            </Link>);
        })}
      </nav>


      <div className="border-t border-white/10 px-3 py-4">
        <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white">
          <LogoutIcon className="h-5 w-5 flex-shrink-0"/>
          <span>Logout</span>
        </button>
      </div>
    </aside>);
}
