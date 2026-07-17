'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Sparkles, LayoutDashboard, Image, Video, Wand2, Scissors, ArrowUpCircle, Images, CreditCard, LogOut, Zap, X } from 'lucide-react';
import { createClient } from '@/lib/supabase';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/create/text-to-image', icon: Image, label: 'Text to Image', cost: '1cr' },
  { href: '/create/text-to-video', icon: Video, label: 'Text to Video', cost: '5cr' },
  { href: '/create/image-to-video', icon: Zap, label: 'Image to Video', cost: '5cr' },
  { href: '/create/image-editing', icon: Wand2, label: 'Image Editing', cost: '2cr' },
  { href: '/create/background-removal', icon: Scissors, label: 'BG Removal', cost: '1cr' },
  { href: '/create/upscaler', icon: ArrowUpCircle, label: 'AI Upscaler', cost: '2cr' },
  { href: '/gallery', icon: Images, label: 'My Gallery' },
  { href: '/pricing', icon: CreditCard, label: 'Pricing' },
];

export default function Sidebar({ credits = 0, plan = 'free', onClose }: { credits?: number; plan?: string; onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="flex flex-col h-full py-4">
      {/* Logo */}
      <div className="px-4 mb-6 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg btn-glow flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-lg gradient-text">Pixora</span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="text-gray-500 hover:text-white lg:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Credits card */}
      <div className="mx-3 mb-4 p-3 rounded-xl bg-gradient-to-br from-purple-600/20 to-violet-600/10 border border-purple-500/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">Available Credits</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 capitalize">{plan}</span>
        </div>
        <div className="text-2xl font-black text-white mb-1">{credits}</div>
        <div className="h-1.5 rounded-full bg-white/10">
          <div className="progress-bar" style={{ width: `${Math.min(100, (credits / 10) * 100)}%` }} />
        </div>
        <Link href="/pricing" className="mt-2 block text-xs text-purple-400 hover:text-purple-300">
          + Get more credits →
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label, cost }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                active
                  ? 'bg-purple-600/20 text-white border border-purple-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}>
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${active ? 'text-purple-400' : 'group-hover:text-purple-400'}`} />
                {label}
              </div>
              {cost && (
                <span className={`text-xs px-1.5 py-0.5 rounded-md ${active ? 'bg-purple-500/30 text-purple-300' : 'bg-white/5 text-gray-500'}`}>
                  {cost}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-2 pt-2 border-t border-white/5 mt-2">
        <button onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}
