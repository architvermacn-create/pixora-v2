import Link from 'next/link';
import Navbar from '@/components/layout/navbar';
import { Sparkles, Zap, Image, Video, Wand2, Scissors, ArrowUpCircle, ArrowRight, Star, Check } from 'lucide-react';

const features = [
  { icon: Image, label: 'Text to Image', desc: 'Transform words into stunning visuals instantly', color: 'from-purple-500 to-violet-600', href: '/create/text-to-image', cost: '1 cr' },
  { icon: Video, label: 'Text to Video', desc: 'Bring your ideas to life with AI video generation', color: 'from-pink-500 to-purple-600', href: '/create/text-to-video', cost: '5 cr' },
  { icon: Zap, label: 'Image to Video', desc: 'Animate any image into a captivating video', color: 'from-blue-500 to-indigo-600', href: '/create/image-to-video', cost: '5 cr' },
  { icon: Wand2, label: 'Image Editing', desc: 'Edit and enhance images with AI precision', color: 'from-emerald-500 to-teal-600', href: '/create/image-editing', cost: '2 cr' },
  { icon: Scissors, label: 'Background Removal', desc: 'Remove backgrounds instantly with AI', color: 'from-orange-500 to-red-600', href: '/create/background-removal', cost: '1 cr' },
  { icon: ArrowUpCircle, label: 'AI Upscaler', desc: 'Upscale images to 4x resolution with AI', color: 'from-cyan-500 to-blue-600', href: '/create/upscaler', cost: '2 cr' },
];

const stats = [
  { value: '10M+', label: 'Images Generated' },
  { value: '500K+', label: 'Happy Creators' },
  { value: '99.9%', label: 'Uptime' },
  { value: '4.9★', label: 'User Rating' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{background: '#06060a'}}>
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-purple-500/20 text-sm text-purple-300 mb-8">
            <div className="pulse-dot" />
            <span>Powered by cutting-edge AI models</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.05]">
            Create anything with
            <br />
            <span className="gradient-text">AI superpowers</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Generate images, videos, remove backgrounds, and upscale content — all powered by the world's most advanced AI models. No design skills needed.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up" className="btn-glow text-white font-semibold px-8 py-4 rounded-xl flex items-center gap-2 text-base">
              Start Creating Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="#features" className="px-8 py-4 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:border-white/20 transition-all text-base">
              See Features
            </Link>
          </div>

          <p className="mt-4 text-sm text-gray-500">Free — 10 credits on signup · No credit card required</p>
        </div>

        {/* Preview cards */}
        <div className="max-w-6xl mx-auto mt-20 grid grid-cols-3 gap-4 opacity-60 pointer-events-none select-none">
          {[
            'https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=400',
            'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=400',
            'https://images.pexels.com/photos/1563356/pexels-photo-1563356.jpeg?auto=compress&cs=tinysrgb&w=400',
          ].map((src, i) => (
            <div key={i} className="rounded-2xl overflow-hidden glass border border-white/5 aspect-square" style={{animationDelay: `${i * 0.5}s`}}>
              <img src={src} alt="" className="w-full h-full object-cover opacity-80" />
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-white/5">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-black gradient-text mb-1">{s.value}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything you need to create</h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">Six powerful AI tools, one unified platform. Credits never expire.</p>
          </div>
          <div className="feature-grid">
            {features.map((f) => (
              <Link key={f.label} href={f.href} className="group p-6 rounded-2xl glass border border-white/5 card-hover block">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-white">{f.label}</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/20">{f.cost}</span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-purple-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Try it now</span><ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center glass rounded-3xl border border-purple-500/20 p-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/5 pointer-events-none" />
          <h2 className="text-4xl font-bold mb-4 relative z-10">Ready to create something amazing?</h2>
          <p className="text-gray-400 mb-8 text-lg relative z-10">Join 500,000+ creators using Pixora today.</p>
          <Link href="/sign-up" className="btn-glow text-white font-semibold px-10 py-4 rounded-xl inline-flex items-center gap-2 relative z-10">
            Get 10 Free Credits <Sparkles className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="font-bold gradient-text">Pixora</span>
            <span className="text-gray-600 text-sm ml-2">© 2024 All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <a href="mailto:hello@pixora.ai" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
