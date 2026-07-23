import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Replicate from 'replicate';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const CREDITS_COST = 0; // Free feature

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

    const { imageUrl = '' } = await request.json();
    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    const db = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });

    const { data: profile } = await db.from('profiles').select('credits').eq('id', user.id).single();
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

    let resultImageUrl: string;
    try {
      // Real-ESRGAN 4x upscaler with face enhancement enabled
      const output = await replicate.run(
        'nightmareai/teal-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b',
        {
          input: {
            image: imageUrl,
            scale: 4,
            face_enhance: true, // Improves portrait quality significantly
          },
        }
      );
      const out = Array.isArray(output) ? output[0] : output;
      resultImageUrl = typeof out === 'object' && out !== null && 'url' in out
        ? (out as { url: () => string }).url()
        : String(out);
    } catch (err) {
      console.error('Upscaler error:', err);
      return NextResponse.json({ error: 'Upscaling failed. Please try again.' }, { status: 500 });
    }

    // Log usage (free — no credit deduction)
    await db.from('transactions').insert({
      user_id: user.id,
      amount: 0,
      credits: 0,
      type: 'usage',
      description: 'AI Upscaler 4x (Free)',
      status: 'completed',
    });

    return NextResponse.json({
      imageUrl: resultImageUrl,
      isMock: false,
      creditsRemaining: profile.credits,
    });
  } catch (error) {
    console.error('upscaler error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
