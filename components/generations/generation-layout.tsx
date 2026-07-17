'use client';
import { ReactNode, useState } from 'react';
import Sidebar from '@/components/layout/sidebar';
import { Menu } from 'lucide-react';

interface Props {
  credits: number;
  plan: string;
  children: ReactNode;
}

export default function GenerationLayout({ credits, plan, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden" style={{background:'#06060a'}}>
      {/* Desktop sidebar */}
      <div className="hidden lg:block w-60 flex-shrink-0 border-r border-white/5" style={{background:'#0a0a10'}}>
        <Sidebar credits={credits} plan={plan} />
      </div>
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-60 border-r border-white/5" style={{background:'#0a0a10'}}>
            <Sidebar credits={credits} plan={plan} onClose={() => setSidebarOpen(false)} />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        <div className="lg:hidden flex items-center px-4 py-3 border-b border-white/5">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white mr-3">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-white font-semibold text-sm">Pixora</span>
        </div>
        {children}
      </div>
    </div>
  );
}
