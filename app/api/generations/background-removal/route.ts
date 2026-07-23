import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Replicate from 'replicate';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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

    // ── BRIA RMBG 2.0 — State-of-the-art background removal ────────
    // Massively superior to rembg: handles hair, fur, complex edges, transparency
    let resultImageUrl: string;
    try {
      const output = await replicate.run(
        'bria-ai/rmbg-2.0',
        {
          input: {
            image: imageUrl,
          },
        }
      );
      const out = Array.isArray(output) ? output[0] : output;
      resultImageUrl = typeof out === 'object' && out !== null && 'url' in out
        ? (out as { url: () => string }).url()
        : String(out);
    } catch (err) {
      console.error('Background removal error (bria-ai/rmbg-2.0):', err);
      // Fallback to rembg if BRIA fails
      try {
        const fallback = await replicate.run(
          'cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003',
          { input: { image: imageUrl } }
        );
        const out = Array.isArray(fallback) ? fallback[0] : fallback;
        resultImageUrl = typeof out === 'object' && out !== null && 'url' in out
          ? (out as { url: () => string }).url()
          : String(out);
      } catch (fallbackErr) {
        console.error('Background removal fallback also failed:', fallbackErr);
        return NextResponse.json({ error: 'Background removal failed. Please try again.' }, { status: 500 });
      }
    }

    // Log usage (free — no credit deduction)
    await db.from('transactions').insert({
      user_id: user.id,
      amount: 0,
      credits: 0,
      type: 'usage',
      description: 'Background Removal (Free)',
      status: 'completed',
    });

    return NextResponse.json({
      imageUrl: resultImageUrl,
      isMock: false,
      creditsRemaining: profile.credits,
    });
  } catch (error) {
    console.error('background-removal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
