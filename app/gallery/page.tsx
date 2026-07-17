import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import Sidebar from '@/components/layout/sidebar';
import { Images, Download, Trash2 } from 'lucide-react';

export default async function GalleryPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase.from('profiles').select('credits,plan').eq('id', user.id).single();
  const { data: generations } = await supabase
    .from('generations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const typeColors: Record<string, string> = {
    'text-to-image': 'bg-purple-500/20 text-purple-300',
    'text-to-video': 'bg-pink-500/20 text-pink-300',
    'image-to-video': 'bg-blue-500/20 text-blue-300',
    'image-editing': 'bg-emerald-500/20 text-emerald-300',
    'background-removal': 'bg-orange-500/20 text-orange-300',
    'upscaler': 'bg-cyan-500/20 text-cyan-300',
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{background:'#06060a'}}>
      <div className="hidden lg:block w-60 flex-shrink-0 border-r border-white/5" style={{background:'#0a0a10'}}>
        <Sidebar credits={profile?.credits ?? 0} plan={profile?.plan ?? 'free'} />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
              <Images className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">My Gallery</h1>
              <p className="text-gray-400 text-sm">{generations?.length || 0} creations</p>
            </div>
          </div>

          {(!generations || generations.length === 0) ? (
            <div className="text-center py-24">
              <Images className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No creations yet</h3>
              <p className="text-gray-600 mb-6">Start creating and your gallery will fill up here</p>
              <Link href="/create/text-to-image" className="btn-glow text-white px-6 py-3 rounded-xl text-sm font-medium">
                Create Something
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {generations.map((g: any) => (
                <div key={g.id} className="group relative rounded-2xl overflow-hidden glass border border-white/5 card-hover aspect-square">
                  {g.output_url && (
                    g.type?.includes('video') ? (
                      <video src={g.output_url} className="w-full h-full object-cover" muted loop />
                    ) : (
                      <img src={g.output_url} alt={g.prompt} className="w-full h-full object-cover" />
                    )
                  )}
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-xs text-white line-clamp-2 mb-2">{g.prompt}</p>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[g.type] || 'bg-white/10 text-white'}`}>
                          {g.type?.replace(/-/g, ' ')}
                        </span>
                        {g.output_url && (
                          <a href={g.output_url} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Status badge */}
                  {g.status === 'processing' && (
                    <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 text-xs text-yellow-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" /> Processing
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
