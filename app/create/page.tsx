'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles, Video, Image as ImageIcon, Wand2, Scissors,
  Zap, ArrowLeft, Palette, Loader2, Download, RefreshCw, AlertCircle, Upload, Eraser, Maximize2, Clock,
} from 'lucide-react';
/* ─── Mode config ─────────────────────────────────────────────────────────── */
const creationModes = [
  { id: 'text-to-image',      icon: Sparkles,  title: 'Text to Image',       description: 'Turn words into stunning images',    color: 'from-amber-500 to-orange-500',   credits: 1, endpoint: '/api/generations/text-to-image',       output: 'image' as const, needsImage: false, needsVideo: false },
  { id: 'text-to-video',      icon: Video,     title: 'Text to Video',       description: 'Create cinematic videos from text',  color: 'from-blue-500 to-cyan-500',      credits: 5, endpoint: '/api/generations/text-to-video',       output: 'video' as const, needsImage: false, needsVideo: false },
  { id: 'image-to-video',     icon: ImageIcon, title: 'Image to Video',      description: 'Animate your photos',               color: 'from-pink-500 to-rose-500',      credits: 4, endpoint: '/api/generations/image-to-video',      output: 'video' as const, needsImage: true,  needsVideo: false },
  { id: 'image-editing',      icon: Wand2,     title: 'Image Editing',       description: 'Enhance and modify images with AI', color: 'from-emerald-500 to-teal-500',   credits: 2, endpoint: '/api/generations/image-editing',       output: 'image' as const, needsImage: true,  needsVideo: false },
  { id: 'video-editing',      icon: Scissors,  title: 'Video Editing',       description: 'Edit and enhance videos',           color: 'from-rose-500 to-red-500',       credits: 3, endpoint: '/api/generations/video-editing',       output: 'video' as const, needsImage: false, needsVideo: true  },
  { id: 'background-removal', icon: Eraser,    title: 'Background Removal',  description: 'Free • Remove backgrounds instantly', color: 'from-violet-500 to-purple-500',  credits: 0, endpoint: '/api/generations/background-removal',  output: 'image' as const, needsImage: true,  needsVideo: false },
  { id: 'upscaler',           icon: Maximize2, title: 'AI Upscaler',         description: 'Free • Enhance image resolution 4x', color: 'from-orange-400 to-yellow-400',  credits: 0, endpoint: '/api/generations/upscaler',            output: 'image' as const, needsImage: true,  needsVideo: false },
];
const CLOUDINARY_CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'drul25shl';
/* ─── Cloudinary upload ───────────────────────────────────────────────────── */
async function uploadToCloudinary(file: File, resourceType: 'image' | 'video'): Promise<{ url: string; publicId: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'ml_default');
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/${resourceType}/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return { url: data.secure_url, publicId: data.public_id };
}
/* ─── Component ──────────────────────────────────────────────────────────── */
export default function CreatePage() {
  const router = useRouter();
  const [activeMode, setActiveMode] = useState('text-to-image');
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ url: string; isMock: boolean; type: 'image' | 'video' } | null>(null);
  const [error, setError] = useState('');
  const [credits, setCredits] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ url: string; publicId: string; preview: string } | null>(null);
  const [videoDuration, setVideoDuration] = useState<'5sec' | '10sec'>('5sec');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mode = creationModes.find(m => m.id === activeMode)!;
  const noPromptNeeded = mode.id === 'background-removal' || mode.id === 'upscaler';
  const effectiveCredits = mode.id === 'text-to-video' ? (videoDuration === '5sec' ? 5 : 10) : mode.credits;
  useEffect(() => {
    const modeParam = new URLSearchParams(window.location.search).get('mode');
    if (modeParam && creationModes.find(m => m.id === modeParam)) {
      setActiveMode(modeParam);
    }
    getSupabaseClient().auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/sign-in'); return; }
      setToken(session.access_token);
      fetch('/api/user/profile', { headers: { Authorization: `Bearer ${session.access_token}` } })
        .then(r => r.json())
        .then(({ profile }) => { if (profile) setCredits(profile.credits); });
    });
  }, [router]);
  const switchMode = (id: string) => {
    if (id === activeMode) return;
    setActiveMode(id);
    setResult(null);
    setError('');
    setUploadedFile(null);
  };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setUploading(true);
    setError('');
    try {
      const resourceType = mode.needsVideo ? 'video' : 'image';
      const uploaded = await uploadToCloudinary(file, resourceType);
      setUploadedFile({ ...uploaded, preview });
    } catch {
      setUploadedFile({ url: '', publicId: '', preview });
      setError('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };
  const handleGenerate = async () => {
    if (!token || (!noPromptNeeded && !prompt.trim())) return;
    setGenerating(true);
    setError('');
    setResult(null);
    try {
      const body: Record<string, string> = { prompt: prompt.trim() };
      if (uploadedFile?.url) body.imageUrl = uploadedFile.url;
      if (uploadedFile?.publicId && mode.needsVideo) body.videoPublicId = uploadedFile.publicId;
      if (mode.id === 'text-to-video') body.duration = videoDuration;
      const res = await fetch(mode.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Generation failed');
        return;
      }
      const url = data.imageUrl ?? data.videoUrl;
      setResult({ url, isMock: !!data.isMock, type: mode.output });
      setCredits(data.creditsRemaining);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setGenerating(false);
    }
  };
  const canGenerate = (noPromptNeeded || !!prompt.trim()) && !generating && credits !== null && credits >= effectiveCredits && (!mode.needsImage || !!uploadedFile?.url);
  const promptPlaceholders: Record<string, string> = {
    'text-to-image':      'A cinematic sunset over a mountain lake, golden hour, 8K photo...',
    'text-to-video':      'A drone flying over a misty forest at dawn, cinematic...',
    'image-to-video':     'Describe how you want the image to move and animate...',
    'image-editing':      'Make the background a tropical beach at sunset...',
    'video-editing':      'Add cinematic color grading and sharpen details...',
    'background-removal': 'Upload an image to remove its background automatically...',
    'upscaler':           'Upload an image to upscale and enhance its resolution...',
  };
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" /><span>Dashboard</span>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Pixora</span>
          </Link>
          <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/30">
            <Zap className="w-3 h-3 mr-1" />
            {credits === null ? '...' : credits} Credits
          </Badge>
        </div>
      </nav>
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sidebar: Mode Picker */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-900/50 border-slate-800 sticky top-24">
              <CardHeader>
                <CardTitle className="text-white">Creation Mode</CardTitle>
                <CardDescription className="text-slate-400">Select what you want to create</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {creationModes.map((m) => {
                  const Icon = m.icon;
                  const active = activeMode === m.id;
                  const affordable = credits === null || credits >= m.credits;
                  return (
                    <button
                      key={m.id}
                      onClick={() => switchMode(m.id)}
                      className={`w-full p-3.5 rounded-xl border transition-all duration-200 text-left group
                        ${active ? 'bg-slate-800 border-blue-500 shadow-lg shadow-blue-500/10' : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'}
                        ${!affordable ? 'opacity-40' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${m.color} flex items-center justify-center shrink-0 ${active ? 'scale-105' : 'group-hover:scale-105'} transition-transform`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-medium text-white text-sm">{m.title}</span>
                            <Badge variant="secondary" className="bg-slate-700 text-slate-300 text-xs shrink-0">{m.credits === 0 ? 'Free' : `${m.credits} cr`}</Badge>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{m.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>
          {/* Studio */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${mode.color} flex items-center justify-center`}>
                    <mode.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white">{mode.title}</CardTitle>
                    <CardDescription className="text-slate-400">
                      {effectiveCredits === 0 ? 'Free — no credits needed' : `${effectiveCredits} credit${effectiveCredits > 1 ? 's' : ''} per generation`}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* File upload */}
                {(mode.needsImage || mode.needsVideo) && (
                  <div className="space-y-2">
                    <Label className="text-white">{mode.needsVideo ? 'Upload Video' : 'Upload Image'}</Label>
                    <div
                      onClick={() => !uploading && fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer
                        ${uploading ? 'border-blue-500/50 bg-blue-500/5' : 'border-slate-700 hover:border-slate-500'}`}
                    >
                      {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                          <p className="text-slate-400 text-sm">Uploading...</p>
                        </div>
                      ) : uploadedFile ? (
                        <div className="flex flex-col items-center gap-2">
                          <img src={uploadedFile.preview} alt="Uploaded" className="max-h-36 mx-auto rounded-lg object-contain" />
                          <p className="text-slate-400 text-xs">Click to replace</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="w-8 h-8 text-slate-500" />
                          <p className="text-slate-400 text-sm">Click to upload or drag and drop</p>
                          <p className="text-slate-500 text-xs">{mode.needsVideo ? 'MP4, MOV up to 100MB' : 'PNG, JPG up to 10MB'}</p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={mode.needsVideo ? 'video/*' : 'image/*'}
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                )}
                {/* Prompt — hidden for image-only modes */}
                {!noPromptNeeded && (
                  <div className="space-y-2">
                    <Label className="text-white">
                      {mode.needsVideo ? 'Edit Instructions' : 'Prompt'}
                    </Label>
                    <Textarea
                      placeholder={promptPlaceholders[activeMode]}
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 min-h-[110px] resize-none focus:border-blue-500"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    />
                  </div>
                )}
                {/* Video Duration Selector — only for text-to-video */}
                {mode.id === 'text-to-video' && (
                  <div className="space-y-2">
                    <Label className="text-white flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Video Duration
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        { value: '5sec', label: '5 Seconds', credits: 5, desc: 'Standard quality' },
                        { value: '10sec', label: '10 Seconds', credits: 10, desc: 'Extended cinematic' },
                      ] as const).map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setVideoDuration(opt.value)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            videoDuration === opt.value
                              ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/10'
                              : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-white text-sm font-medium">{opt.label}</span>
                            <Badge variant="secondary" className="bg-slate-700 text-slate-300 text-xs">{opt.credits} cr</Badge>
                          </div>
                          <p className="text-slate-400 text-xs">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2 bg-red-900/20 border border-red-800/50 rounded-lg px-4 py-3">
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}
                {/* Generate */}
                <Button
                  className={`w-full h-12 bg-gradient-to-r ${mode.color} hover:opacity-90 text-white font-semibold transition-all`}
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                >
                  {generating ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating...</>
                  ) : (
                    <><Sparkles className="w-5 h-5 mr-2" />{effectiveCredits === 0 ? 'Generate (Free)' : `Generate (${effectiveCredits} credit${effectiveCredits > 1 ? 's' : ''})`}</>
                  )}
                </Button>
                {credits !== null && credits < effectiveCredits && (
                  <p className="text-center text-sm text-slate-400">
                    Not enough credits.{' '}
                    <Link href="/pricing" className="text-blue-400 hover:text-blue-300 underline">Upgrade your plan</Link>
                  </p>
                )}
                {/* Result */}
                {result && (
                  <div className="space-y-4 pt-4 border-t border-slate-700/60">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white">Generated Result</h3>
                      {result.isMock && (
                        <Badge className="bg-amber-600/20 text-amber-300 border-amber-500/30 text-xs">
                          Preview (mock)
                        </Badge>
                      )}
                    </div>
                    <div className="rounded-xl overflow-hidden border border-slate-700">
                      {result.type === 'video' ? (
                        <video src={result.url} controls className="w-full h-auto" />
                      ) : (
                        <img src={result.url} alt="Generated result" className="w-full h-auto" />
                      )}
                    </div>
                    <div className="flex gap-3">
                      <a href={result.url} download={activeMode === 'background-removal' ? 'background-removed.png' : 'pixora-result'} target="_blank" rel="noopener noreferrer" className="flex-1">
                        <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white">
                          <Download className="w-4 h-4 mr-2" />Download
                        </Button>
                      </a>
                      <Button
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-white"
                        onClick={handleGenerate}
                        disabled={generating || !canGenerate}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />Regenerate
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
