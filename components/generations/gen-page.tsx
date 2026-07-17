'use client';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Loader2, Download, RefreshCw, Upload, Sparkles, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface GenPageProps {
  title: string;
  description: string;
  apiEndpoint: string;
  creditCost: number;
  icon: React.ReactNode;
  iconBg: string;
  requiresImage?: boolean;
  promptPlaceholder?: string;
  showNegativePrompt?: boolean;
  showDimensions?: boolean;
}

export default function GenPage({
  title, description, apiEndpoint, creditCost, icon, iconBg,
  requiresImage = false, promptPlaceholder = 'Describe what you want to create...',
  showNegativePrompt = false, showDimensions = false,
}: GenPageProps) {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const supabase = createClient();

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => { setUploadedFile(e.target?.result as string); setImageUrl(e.target?.result as string); };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 1, disabled: loading,
  });

  const handleGenerate = async () => {
    if (!prompt && !requiresImage) return toast.error('Please enter a prompt');
    if (requiresImage && !imageUrl) return toast.error('Please upload an image');
    setLoading(true);
    setResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return toast.error('Please sign in'), setLoading(false);

      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ prompt, negativePrompt, imageUrl, width, height }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');

      setResult(data.url);
      setIsVideo(data.url?.includes('.mp4') || data.url?.includes('video'));
      toast.success(`Created! ${creditCost} credit${creditCost > 1 ? 's' : ''} used.`);
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center text-white`}>{icon}</div>
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="text-gray-400 text-sm">{description}</p>
        </div>
        <div className="ml-auto">
          <span className="text-xs px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/20 font-medium">
            {creditCost} credit{creditCost > 1 ? 's' : ''} per generation
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Input */}
        <div className="space-y-4">
          {/* Image Upload */}
          {requiresImage && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Input Image</label>
              <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragActive ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 hover:border-purple-500/40 hover:bg-white/2'
              }`}>
                <input {...getInputProps()} />
                {uploadedFile ? (
                  <img src={uploadedFile} alt="Uploaded" className="w-full max-h-48 object-contain rounded-xl" />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-gray-500">
                    <Upload className="w-10 h-10" />
                    <p className="text-sm">Drop image here or click to upload</p>
                    <p className="text-xs text-gray-600">PNG, JPG, WEBP supported</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Prompt */}
          {!requiresImage || prompt !== undefined && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {requiresImage ? 'Additional Instructions (optional)' : 'Prompt'}
              </label>
              <textarea
                value={prompt} onChange={e => setPrompt(e.target.value)}
                rows={4} placeholder={promptPlaceholder}
                className="input-dark resize-none"
              />
            </div>
          )}

          {/* Negative prompt */}
          {showNegativePrompt && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Negative Prompt (optional)</label>
              <input type="text" value={negativePrompt} onChange={e => setNegativePrompt(e.target.value)}
                placeholder="What to avoid..." className="input-dark" />
            </div>
          )}

          {/* Dimensions */}
          {showDimensions && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Width</label>
                <select value={width} onChange={e => setWidth(Number(e.target.value))}
                  className="input-dark">
                  {[512, 768, 1024, 1280].map(v => <option key={v} value={v}>{v}px</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Height</label>
                <select value={height} onChange={e => setHeight(Number(e.target.value))}
                  className="input-dark">
                  {[512, 768, 1024, 1280].map(v => <option key={v} value={v}>{v}px</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Generate button */}
          <button onClick={handleGenerate} disabled={loading}
            className="w-full btn-glow text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed text-base mt-2">
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Generating... this may take a moment</>
            ) : (
              <><Sparkles className="w-5 h-5" /> Generate</>
            )}
          </button>
          {loading && (
            <p className="text-center text-xs text-gray-500 animate-pulse">
              AI is working its magic — usually 15-60 seconds ✨
            </p>
          )}
        </div>

        {/* Right: Result */}
        <div className="space-y-4">
          <label className="block text-sm text-gray-400">Output</label>
          <div className="rounded-2xl overflow-hidden glass border border-white/5 aspect-square flex items-center justify-center relative">
            {loading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
                <p className="text-gray-500 text-sm">Generating your creation...</p>
              </div>
            ) : result ? (
              <>
                {isVideo ? (
                  <video src={result} controls autoPlay loop className="w-full h-full object-contain" />
                ) : (
                  <img src={result} alt="Generated" className="w-full h-full object-contain" />
                )}
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <a href={result} download target="_blank" rel="noopener noreferrer"
                    className="p-2.5 rounded-xl glass border border-white/10 text-white hover:bg-white/10 transition-colors">
                    <Download className="w-4 h-4" />
                  </a>
                  <button onClick={() => setResult(null)}
                    className="p-2.5 rounded-xl glass border border-white/10 text-white hover:bg-white/10 transition-colors">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 text-gray-600">
                <div className="w-16 h-16 rounded-2xl bg-white/3 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-sm">Your creation will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
