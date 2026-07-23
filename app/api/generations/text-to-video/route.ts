import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Replicate from 'replicate';
import { enhanceVideoPrompt } from '@/lib/prompt-enhance';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Duration-based credit costs
const CREDITS: Record<string, number> = {
  '5sec': 5,
  '10sec': 10,
};

const hasReplicate = () => {
  const t = process.env.REPLICATE_API_TOKEN;
  return !!t && !t.startsWith('r8_placeholder');
};

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);

    // Secure auth via Supabase token verification
    const authClient = createClient(supabaseUrl, anonKey);
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt = '', duration = '5sec' } = await request.json();
    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const creditsCost = CREDITS[duration] ?? CREDITS['5sec'];

    const db = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });

    const { data: profile } = await db.from('profiles').select('credits').eq('id', user.id).single();
    if (!profile || profile.credits < creditsCost) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
    }

    // ── Intelligent Video Prompt Enhancement ─────────────────────────────────────
    const enhancedPrompt = enhanceVideoPrompt(prompt.trim());

    let videoUrl: string;
    let isMock = false;

    if (hasReplicate()) {
      try {
        const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

        // ── MiniMax Video-01 — Best text-to-video model ───────────────────────
        // Superior to stable-video-diffusion for text-to-video
        // Generates cinematic quality 5-6 second videos from text prompts

        const output = await replicate.run(
          'minimax/video-01',
          {
            input: {
              prompt: enhancedPrompt,
              prompt_optimizer: true, // Let MiniMax also optimize the prompt
            },
          }
        );

        const out = Array.isArray(output) ? output[0] : output;
        videoUrl = typeof out === 'object' && out !== null && 'url' in out
          ? (out as { url: () => string }).url()
          : String(out);
      } catch (genError) {
        console.error('Text-to-video generation error:', genError);
        return NextResponse.json({ error: 'Video generation failed. No credits were deducted.' }, { status: 500 });
      }
    } else {
      await new Promise(r => setTimeout(r, 2000));
      videoUrl = 'https://images.pexels.com/photos/2510428/pexels-photo-2510428.jpeg?auto=compress&cs=tinysrgb&w=1024';
      isMock = true;
    }

    // Deduct credits only after successful generation
    await db.from('profiles').update({ credits: profile.credits - creditsCost }).eq('id', user.id);
    await db.from('transactions').insert({
      user_id: user.id,
      amount: -creditsCost,
      credits: creditsCost,
      type: 'usage',
      description: `Text to Video (${duration}): ${prompt.trim().slice(0, 60)}`,
      status: 'completed',
    });

    return NextResponse.json({ videoUrl, isMock, creditsRemaining: profile.credits - creditsCost });
  } catch (error) {
    console.error('text-to-video error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
