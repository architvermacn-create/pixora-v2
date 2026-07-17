import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import Sidebar from '@/components/layout/sidebar';
import { Image, Video, Zap, Wand2, Scissors, ArrowUpCircle, ArrowRight, Clock } from 'lucide-react';

const tools = [
  { href: '/create/text-to-image', icon: Image, label: 'Text to Image', desc: 'Turn words into art', cost: 1, color: 'from-purple-500 to-violet-600' },
  { href: '/create/text-to-video', icon: Video, label: 'Text to Video', desc: 'Generate videos from text', cost: 5, color: 'from-pink-500 to-purple-600' },
  { href: '/create/image-to-video', icon: Zap, label: 'Image to Video', desc: 'Animate your images', cost: 5, color: 'from-blue-500 to-indigo-600' },
  { href: '/create/image-editing', icon: Wand2, label: 'Image Editing', desc: 'AI-powered edits', cost: 2, color: 'from-emerald-500 to-teal-600' },
  { href: '/create/background-removal', icon: Scissors, label: 'BG Removal', desc: 'Remove backgrounds', cost: 1, color: 'from-orange-500 to-red-600' },
  { href: '/create/upscaler', icon: ArrowUpCircle, label: 'AI Upscaler', desc: 'Upscale to 4x', cost: 2, color: 'from-cyan-500 to-blue-600' },
];

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  const credits = profile?.credits ?? 0;
  const plan = profile?.plan ?? 'free';

  const { data: generations } = await supabase
    .from('generations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(6);

  return (
    <div className="flex h-screen overflow-hidden" style={{background:'#06060a'}}>
      {/* Sidebar */}
      <div className="hidden lg:block w-60 flex-shrink-0 border-r border-white/5" style={{background:'#0a0a10'}}>
        <Sidebar credits={credits} plan={plan} />
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
              <span className="gradient-text">{profile?.full_name?.split(' ')[0] || 'Creator'}</span> 👋
            </h1>
            <p className="text-gray-400 text-sm mt-1">What would you like to create today?</p>
          </div>

          {/* Credits banner */}
          <div className="mb-8 p-5 rounded-2xl relative overflow-hidden border border-purple-500/20"
            style={{background:'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(168,85,247,0.08))'}}>
            <div className="absolute inset-0 pointer-events-none" style={{background:'radial-gradient(ellipse at 80% 50%, rgba(168,85,247,0.1), transparent)'}} />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-4xl font-black text-white">{credits}</span>
                  <span className="text-gray-400 text-sm">credits available</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/20 capitalize">{plan} Plan</span>
                  <span className="text-xs text-gray-500">·</span>
                  <span className="text-xs text-gray-400">Credits never expire</span>
                </div>
              </div>
              <Link href="/pricing"
                className="btn-glow text-white text-sm font-medium px-5 py-2.5 rounded-xl flex items-center gap-2 self-start sm:self-auto">
                Get More Credits <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Tools grid */}
          <h2 className="text-lg font-semibold text-white mb-4">Create Something New</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-10">
            {tools.map(t => (
              <Link key={t.href} href={t.href}
                className="group p-4 rounded-2xl glass border border-white/5 card-hover block">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <t.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex items-start justify-between gap-1 mb-1">
                  <span className="font-medium text-white text-sm">{t.label}</span>
                  <span className="text-xs text-gray-500 shrink-0">{t.cost} cr</span>
                </div>
                <p className="text-xs text-gray-500">{t.desc}</p>
              </Link>
            ))}
          </div>

          {/* Recent */}
          {generations && generations.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" /> Recent Creations
                </h2>
                <Link href="/gallery" className="text-sm text-purple-400 hover:text-purple-300">View all →</Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {generations.map((g: any) => (
                  <div key={g.id} className="rounded-2xl overflow-hidden glass border border-white/5 aspect-square relative group">
                    {g.output_url && (
                      <img src={g.output_url} alt={g.prompt} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <p className="text-xs text-white line-clamp-2">{g.prompt}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
