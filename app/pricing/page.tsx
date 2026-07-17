'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Sparkles, Zap, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '@/components/layout/navbar';

const plans = [
  {
    id: 'starter', name: 'Starter', price: 9, credits: 100, popular: false,
    features: ['100 credits/month', 'All generation types', 'Email support', 'Standard processing', 'Priority queue'],
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'pro', name: 'Pro', price: 29, credits: 400, popular: true,
    features: ['400 credits/month', 'All generation types', 'Priority support', 'Fastest processing', 'API access', 'Custom presets'],
    color: 'from-purple-500 to-violet-600',
  },
  {
    id: 'business', name: 'Business', price: 79, credits: 1500, popular: false,
    features: ['1500 credits/month', 'All generation types', '24/7 dedicated support', 'Instant processing', 'Full API access', 'Custom models', 'Team collaboration'],
    color: 'from-pink-500 to-purple-600',
  },
];

declare global { interface Window { Razorpay: any; } }

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const handlePurchase = async (plan: typeof plans[0]) => {
    setLoading(plan.id);
    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id, amount: plan.price }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Payment init failed');

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: 'INR',
        name: 'Pixora',
        description: `${plan.name} Plan — ${plan.credits} Credits`,
        order_id: data.orderId,
        handler: async (response: any) => {
          const verifyRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...response, planId: plan.id, credits: plan.credits }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            toast.success(`🎉 ${plan.credits} credits added to your account!`);
            router.push('/dashboard');
          } else {
            toast.error('Payment verification failed');
          }
        },
        prefill: { name: '', email: '' },
        theme: { color: '#7c3aed' },
        modal: { ondismiss: () => setLoading(null) },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err.message || 'Payment failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen" style={{background:'#06060a'}}>
      {/* Razorpay SDK */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      <Navbar />

      <div className="pt-28 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-purple-500/20 text-sm text-purple-300 mb-6">
              <Sparkles className="w-3.5 h-3.5" /> Simple, transparent pricing
            </div>
            <h1 className="text-5xl font-black mb-4">Choose your plan</h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">Credits never expire. Upgrade or downgrade anytime. Secure payments via Razorpay.</p>
          </div>

          {/* Free tier banner */}
          <div className="mb-8 p-4 rounded-2xl border border-white/8 glass flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <Zap className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <span className="text-white text-sm font-medium">Free Forever Plan</span>
                <p className="text-xs text-gray-500">10 credits on signup · No card needed</p>
              </div>
            </div>
            <Link href="/sign-up" className="text-sm text-purple-400 hover:text-purple-300 border border-purple-500/30 px-4 py-2 rounded-lg">
              Get Started →
            </Link>
          </div>

          {/* Plans */}
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map(plan => (
              <div key={plan.id} className={`relative rounded-2xl border p-6 flex flex-col ${
                plan.popular
                  ? 'border-purple-500/50 bg-gradient-to-b from-purple-600/10 to-transparent'
                  : 'border-white/8 glass'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="btn-glow text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3" /> Most Popular
                    </span>
                  </div>
                )}

                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                  <Zap className="w-5 h-5 text-white" />
                </div>

                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-black text-white">₹{plan.price * 83}</span>
                  <span className="text-gray-500 text-sm">/month</span>
                </div>
                <div className="text-purple-400 text-sm font-medium mb-6">⚡ {plan.credits} credits</div>

                <ul className="space-y-3 flex-1 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-purple-400 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>

                <button onClick={() => handlePurchase(plan)} disabled={loading === plan.id}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                    plan.popular
                      ? 'btn-glow text-white'
                      : 'border border-white/10 text-white hover:border-purple-500/40 hover:bg-purple-500/10'
                  } disabled:opacity-60`}>
                  {loading === plan.id ? 'Processing...' : `Get ${plan.name}`}
                </button>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-gray-500 mt-10">
            Secure payments powered by Razorpay · 30-day money-back guarantee
          </p>
        </div>
      </div>
    </div>
  );
}
