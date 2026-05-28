import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import AuthProvider from '@/components/providers/AuthProvider';
import './globals.css';
const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
});
export const metadata: Metadata = {
    title: 'VedaAI — AI Assessment Creator',
    description: 'Create AI-powered assessments and question papers with VedaAI.',
};
export default function RootLayout({ children, }: {
    children: React.ReactNode;
}) {
    return (<html lang="en" className={inter.variable}>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster richColors position="top-right"/>
      </body>
    </html>);
}
