import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  try {
    const { amount } = await request.json();
    const amountInPaise = Math.round(amount * 100);
    const body = JSON.stringify({ amount: amountInPaise, currency: 'INR', receipt: 'order_' + Date.now() });
    const authStr = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST', headers: { 'Authorization': `Basic ${authStr}`, 'Content-Type': 'application/json' }, body,
    });
    const order = await res.json();
    if (!res.ok) throw new Error(order.error?.description || 'Order creation failed');
    return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
