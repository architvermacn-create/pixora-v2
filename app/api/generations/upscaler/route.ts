import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Replicate from 'replicate';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function decodeJWT(token: string) {
  try {
    const p = JSON.parse(Buffer.from(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'), 'base64').toString());
    return p.sub ? { id: p.sub, email: p.email } : null;
  } catch { return null; }
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = decodeJWT(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data: profile, error: profileErr } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
  if (profileErr || !profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  if (profile.credits < 2) return NextResponse.json({ error: 'Insufficient credits.' }, { status: 402 });
  const { imageUrl } = await request.json();
  await supabase.from('profiles').update({ credits: profile.credits - 2, updated_at: new Date().toISOString() }).eq('id', user.id);
  try {
    const replicate = new Replicate({ auth: process.env.REPLICATEE_API_TOKEN! });
    const input: any = { image: imageUrl, scale: 4 };
    const { data: gen } = await supabase.from('generations').insert({ user_id: user.id, type: 'upscaler', prompt: imageUrl, status: 'processing', credits_used: 2, created_at: new Date().toISOString() }).select().single();
    const output = await replicate.run('nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b' as any, { input }) as any;
    const outputUrl = Array.isArray(output) ? output[0] : output;
    if (gen?.id) await supabase.from('generations').update({ output_url: String(outputUrl), status: 'completed' }).eq('id', gen.id);
    return NextResponse.json({ url: String(outputUrl), creditsUsed: 2 });
  } catch (err: any) {
    await supabase.from('profiles').update({ credits: profile.credits, updated_at: new Date().toISOString() }).eq('id', user.id);
    return NextResponse.json({ error: err.message || 'Generation failed' }, { status: 500 });
  }
}
