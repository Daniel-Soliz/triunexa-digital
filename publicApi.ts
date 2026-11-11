import { supabase } from './supabaseApi';
export { supabase };
export interface PublicLead {
 id: string; company: string; segment: string; city: string; state: string; neighborhood: string;
 phone?: string; whatsapp?: string; website?: string; instagram_url?: string;
 source_url?: string; source_verified_at: string; company_summary: string;
 email?: string; address?: string; contact_name?: string; contact_role?: string;
 details_sources?: {label:string;url:string}[];
}
export function safeUrl(value?: string): string | undefined {
 try { const u = new URL(value || ''); return ['https:', 'http:'].includes(u.protocol) ? u.href : undefined; } catch { return undefined; }
}
function randomVisitorId() {
 if(typeof crypto.randomUUID==='function')return crypto.randomUUID();
 // Local HTTP previews do not expose randomUUID; getRandomValues remains available.
 const bytes=crypto.getRandomValues(new Uint8Array(16));
 bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
 const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
 return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
const memoryVisitor = randomVisitorId();
const memorySession = randomVisitorId();
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
 await heartbeat();
 const {visitor,session}=visitorIds();
 const {data,error}=await supabase.rpc('truinexa_public_feed',{p_visitor:visitor,p_session:session});
 if(error) throw error;
 return (data||[]) as PublicLead[];
}
export async function claimPublicLead(id:string): Promise<PublicLead|null> {
 await heartbeat();
 const {visitor,session}=visitorIds();
 const {data,error}=await supabase.rpc('truinexa_public_claim',{p_visitor:visitor,p_session:session,p_lead:id});
 if(error) throw error;
 return ((data||[])[0]||null) as PublicLead|null;
}

export const BUSINESS_SECTORS = ['Estética','Cabeleireiros','Barbearias','Advocacia','Odontologia','Academias','Pet shops','Restaurantes','Contabilidade','Oficinas'];
export function canonicalSector(segment:string) {
 const s=(segment||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 if(/advog|advoc|jurid/.test(s))return 'Advocacia';
 if(/contab/.test(s))return 'Contabilidade';
 if(/barbear/.test(s))return 'Barbearias';
 if(/cabele|salao|beleza/.test(s))return 'Cabeleireiros';
 if(/odonto|dent/.test(s))return 'Odontologia';
 if(/estet|derm/.test(s))return 'Estética';
 if(/academ|fitness|pilates/.test(s))return 'Academias';
 if(/pet|veterin/.test(s))return 'Pet shops';
 if(/restaur|pizza|aliment|lanch/.test(s))return 'Restaurantes';
 if(/oficina|mecan|auto/.test(s))return 'Oficinas';
 return segment||'Outros serviços';
}
export function rotateDaily(leads:PublicLead[], day=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo'}).format(new Date())) {
 const hash=(value:string)=>{let h=2166136261;for(let i=0;i<value.length;i++)h=Math.imul(h^value.charCodeAt(i),16777619);return h>>>0;};
 // Daily rotation changes discovery order. It never pretends to be fresh research.
 const buckets=new Map<string,PublicLead[]>();
 for(const lead of leads){const key=canonicalSector(lead.segment);if(!buckets.has(key))buckets.set(key,[]);buckets.get(key)!.push(lead);}
 const groups=[...buckets.entries()].sort(([a],[b])=>hash(a+day)-hash(b+day)).map(([,rows])=>rows.sort((a,b)=>hash(a.id+day)-hash(b.id+day)));
 const ordered:PublicLead[]=[];
 while(groups.some(g=>g.length)){for(const group of groups){const lead=group.shift();if(lead)ordered.push(lead);}}
 return ordered;
}
