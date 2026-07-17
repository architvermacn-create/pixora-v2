'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, Menu, X, ChevronDown, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => { window.removeEventListener('scroll', onScroll); listener.subscription.unsubscribe(); };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'glass border-b border-white/5 shadow-lg shadow-black/30' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg btn-glow flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            <span className="gradient-text">Pixora</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</Link>
          <Link href="/pricing" className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</Link>
          <Link href="/#showcase" className="text-sm text-gray-400 hover:text-white transition-colors">Showcase</Link>
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm text-gray-300 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5">
                Dashboard
              </Link>
              <button onClick={handleSignOut} className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2 rounded-lg border border-white/10 hover:border-white/20">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/sign-in" className="text-sm text-gray-300 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5">
                Sign in
              </Link>
              <Link href="/sign-up" className="text-sm font-medium px-4 py-2 rounded-lg btn-glow text-white">
                Get Started Free
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden glass border-t border-white/5 px-6 py-4 space-y-3">
          <Link href="/#features" className="block text-sm text-gray-400 hover:text-white py-2" onClick={() => setMenuOpen(false)}>Features</Link>
          <Link href="/pricing" className="block text-sm text-gray-400 hover:text-white py-2" onClick={() => setMenuOpen(false)}>Pricing</Link>
          <div className="pt-3 border-t border-white/5 flex flex-col gap-2">
            {user ? (
              <Link href="/dashboard" className="btn-glow text-white text-sm font-medium py-2.5 px-4 rounded-lg text-center" onClick={() => setMenuOpen(false)}>Dashboard</Link>
            ) : (
              <>
                <Link href="/sign-in" className="text-center text-sm text-gray-300 py-2.5 px-4 rounded-lg border border-white/10" onClick={() => setMenuOpen(false)}>Sign in</Link>
                <Link href="/sign-up" className="btn-glow text-white text-sm font-medium py-2.5 px-4 rounded-lg text-center" onClick={() => setMenuOpen(false)}>Get Started Free</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
