import { supabase } from './supabaseApi';
export { supabase };
export interface PublicLead {
 id: string; company: string; segment: string; city: string; state: string; neighborhood: string;
 phone: string; whatsapp: string; website: string; instagram_url: string;
 source_url: string; source_verified_at: string; company_summary: string;
}
export function safeUrl(value?: string): string | undefined {
 try { const u = new URL(value || ''); return ['https:', 'http:'].includes(u.protocol) ? u.href : undefined; } catch { return undefined; }
}
let memoryVisitor = crypto.randomUUID();
let memorySession = crypto.randomUUID();
function storedId(storage: 'localStorage' | 'sessionStorage', key: string, fallback: string) {
 try { const old = window[storage].getItem(key); if(old && /^[0-9a-f-]{36}$/i.test(old)) return old; window[storage].setItem(key,fallback); } catch { /* Storage can be blocked. */ }
 return fallback;
}
export function visitorIds() {
 return { visitor: storedId('localStorage','triunexa-visitor',memoryVisitor), session: storedId('sessionStorage','triunexa-session',memorySession) };
}
export async function heartbeat() {
 const { visitor, session } = visitorIds();
 const { error } = await supabase.rpc('truinexa_public_heartbeat',{p_visitor:visitor,p_session:session});
 if(error) throw error;
}
export async function loadPublicLeads(): Promise<PublicLead[]> {
 const all: PublicLead[] = [];
 for(let start=0; ; start+=1000) {
  const {data,error} = await supabase.from('truinexa_public_leads').select('*').order('company').order('id').range(start,start+999);
  if(error) throw error;
  all.push(...(data || []));
  if(!data || data.length<1000) return all;
 }
}
