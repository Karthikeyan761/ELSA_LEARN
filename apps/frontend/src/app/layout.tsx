import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'ELSA Learn - AI English Speaking Practice',
  description: 'AI-powered English pronunciation and speaking practice platform. Get instant feedback on every word.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`font-sans bg-slate-50 text-slate-900 antialiased selection:bg-indigo-500/30`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
