import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Replicate from 'replicate';
import { enhanceImagePrompt } from '@/lib/prompt-enhance';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const CREDITS_COST = 1;

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

    const { prompt, aspectRatio = '1:1' } = await request.json();
    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const db = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });

    const { data: profile } = await db.from('profiles').select('credits').eq('id', user.id).single();
    if (!profile || profile.credits < CREDITS_COST) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
    }

    // ── Intelligent Prompt Enhancement ─────────────────────────────────────
    const { positive: enhancedPrompt, negative: negativePrompt, useHighQualityModel } = enhanceImagePrompt(prompt.trim());

    let imageUrl: string;
    let isMock = false;

    if (hasReplicate()) {
      try {
        const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

        // Use flux-dev for deity/portrait (higher quality), flux-schnell for speed
        if (useHighQualityModel) {
          const output = await replicate.run('black-forest-labs/flux-dev', {
            input: {
              prompt: enhancedPrompt,
              num_outputs: 1,
              num_inference_steps: 28,
              guidance_scale: 3.5,
              output_format: 'webp' as const,
              output_quality: 95,
              aspect_ratio: aspectRatio as '1:1' | '16:9' | '9:16' | '4:3' | '3:4',
              go_fast: false,
            },
          });
          const out = Array.isArray(output) ? output[0] : output;
          imageUrl = typeof out === 'object' && out !== null && 'url' in out
            ? (out as { url: () => string }).url()
            : String(out);
        } else {
          const output = await replicate.run('black-forest-labs/flux-schnell', {
            input: {
              prompt: enhancedPrompt,
              num_outputs: 1,
              num_inference_steps: 4,
              output_format: 'webp' as const,
              output_quality: 95,
              aspect_ratio: aspectRatio as '1:1' | '16:9' | '9:16' | '4:3' | '3:4',
              go_fast: true,
              megapixels: '1' as const,
            },
          });
          const out = Array.isArray(output) ? output[0] : output;
          imageUrl = typeof out === 'object' && out !== null && 'url' in out
            ? (out as { url: () => string }).url()
            : String(out);
        }
      } catch (genError) {
        console.error('Flux generation error:', genError);
        return NextResponse.json({ error: 'Image generation failed. No credits were deducted.' }, { status: 500 });
      }
    } else {
      await new Promise(r => setTimeout(r, 1500));
      imageUrl = 'https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=1024';
      isMock = true;
    }

    // Deduct credits only after successful generation
    await db.from('profiles').update({ credits: profile.credits - CREDITS_COST }).eq('id', user.id);
    await db.from('transactions').insert({
      user_id: user.id,
      amount: -CREDITS_COST,
      credits: CREDITS_COST,
      type: 'usage',
      description: `Text to Image: ${prompt.trim().slice(0, 60)}`,
      status: 'completed',
    });

    return NextResponse.json({ imageUrl, isMock, creditsRemaining: profile.credits - CREDITS_COST });
  } catch (error) {
    console.error('text-to-image error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
