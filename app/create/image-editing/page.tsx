import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import GenerationLayout from '@/components/generations/generation-layout';
import GenPage from '@/components/generations/gen-page';
import { Sparkles } from 'lucide-react';

export default async function Page() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');
  const { data: profile } = await supabase.from('profiles').select('credits,plan').eq('id', user.id).single();
  return (
    <GenerationLayout credits={profile?.credits ?? 0} plan={profile?.plan ?? 'free'}>
      <GenPage
        title="Image Editing"
        description="Edit and transform images with AI"
        apiEndpoint="/api/generations/image-editing"
        creditCost={2}
        icon={<Sparkles className="w-6 h-6" />}
        iconBg="bg-gradient-to-br from-emerald-500 to-teal-600"
        requiresImage={true}
        showNegativePrompt={true}
        showDimensions={false}
        promptPlaceholder="Describe what you want..."
      />
    </GenerationLayout>
  );
}
