import { Toaster as Sonner } from '@/components/ui/sonner';
import type { ReactNode } from 'react';

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="min-h-screen bg-gray-50">
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 h-screen">
                {children}

                {/* Portal for modals, toasts, etc. */}
                <Sonner position="bottom-right" />
            </main>
        </div>
    );
}