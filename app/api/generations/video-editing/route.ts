import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Replicate from 'replicate';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;
function decodeJWT(token: string) {
  try { const p = JSON.parse(Buffer.from(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'),'base64').toString()); return p.sub ? {id:p.sub} : null; } catch { return null; }
}
export async function POST(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ','');
  if (!token) return NextResponse.json({error:'Unauthorized'},{status:401});
  const user = decodeJWT(token);
  if (!user) return NextResponse.json({error:'Unauthorized'},{status:401});
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const {data:profile,error:profileErr} = await supabase.from('profiles').select('credits').eq('id',user.id).single();
  if (profileErr||!profile) return NextResponse.json({error:'Profile not found'},{status:404});
  if (profile.credits < 3) return NextResponse.json({error:'Insufficient credits.'},{status:402});
  const {prompt,imageUrl} = await request.json();
  await supabase.from('profiles').update({credits:profile.credits-3,updated_at:new Date().toISOString()}).eq('id',user.id);
  try {
    const replicate = new Replicate({auth:process.env.REPLICATE_API_TOKEN!});
    const input:any = {prompt,video:imageUrl};
    const {data:gen} = await supabase.from('generations').insert({user_id:user.id,type:'video-editing',prompt:prompt||'generation',status:'processing',credits_used:3,created_at:new Date().toISOString()}).select().single();
    const output = await replicate.run('zsxkib/mmaudio' as any,{input}) as any;
    const outputUrl = Array.isArray(output)?output[0]:output;
    if (gen?.id) await supabase.from('generations').update({output_url:String(outputUrl),status:'completed'}).eq('id',gen.id);
    return NextResponse.json({url:String(outputUrl),creditsUsed:3});
  } catch(err:any) {
    await supabase.from('profiles').update({credits:profile.credits,updated_at:new Date().toISOString()}).eq('id',user.id);
    return NextResponse.json({error:err.message||'Generation failed'},{status:500});
  }
}
