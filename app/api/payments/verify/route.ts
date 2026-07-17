import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
export const dynamic = 'force-dynamic';

function decodeJWT(token: string) {
  try {
    const p = JSON.parse(Buffer.from(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'), 'base64').toString());
    return p.sub ? { id: p.sub } : null;
  } catch { return null; }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, credits } = await request.json();

    // Verify signature
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    if (expectedSig !== razorpay_signature) {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
    }

    if (token) {
      const user = decodeJWT(token);
      if (user) {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        const { data: profile } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
        const newCredits = (profile?.credits || 0) + credits;
        await supabase.from('profiles').update({ credits: newCredits, plan: planId, updated_at: new Date().toISOString() }).eq('id', user.id);
        await supabase.from('credit_transactions').insert({
          user_id: user.id, amount: credits, type: 'purchase',
          payment_id: razorpay_payment_id, created_at: new Date().toISOString(),
        });
      }
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
