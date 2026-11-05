import { useEffect, useRef } from 'react';
import { ArrowUpRight, Instagram, Mail, MapPin, MessageCircle, Phone, ShieldCheck, UserRound, X } from 'lucide-react';
import { safeUrl, type PublicLead } from './publicApi';
export function whatsappUrl(value?:string) {
 const digits=(value||'').replace(/\D/g,'');
 if(!/^(?:55)?[1-9]\d9\d{8}$/.test(digits))return undefined;
 return 'https://wa.me/'+(digits.length===11?'55'+digits:digits);
}
export function emailUrl(value?:string) {
 return value&&/^[^\s@<>"?&#]+@[^\s@<>"?&#]+\.[^\s@<>"?&#]+$/.test(value)?'mailto:'+value:undefined;
}
export default function CompanyDialog({lead,onClose}:{lead:PublicLead;onClose:()=>void}) {
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const dialog=ref.current;dialog?.showModal();return()=>dialog?.close();},[]);
 const whatsapp=whatsappUrl(lead.whatsapp),email=emailUrl(lead.email);
 const sources=Array.isArray(lead.details_sources)?lead.details_sources:[];
 return <dialog ref={ref} className="company-dialog" aria-labelledby="company-title" onCancel={onClose}
  onClick={event=>{if(event.target===ref.current)onClose();}} data-lenis-prevent>
  <div className="company-dialog-heading"><span className="eyebrow">CATÁLOGO DE INFORMAÇÕES / {lead.segment||'EMPRESA'}</span><button type="button" onClick={onClose} aria-label="Fechar informações da empresa"><X size={20}/></button></div>
  <div className="company-monogram large">{lead.company.charAt(0)}</div>
  <h2 id="company-title">{lead.company}</h2>
  <p className="company-intro">{lead.company_summary||'Consulte os canais comerciais públicos desta empresa.'}</p>
  <div className="company-info-grid">
   <section><h3><MapPin size={16}/>Localização</h3><p>{lead.address||[lead.neighborhood,lead.city,lead.state].filter(Boolean).join(' · ')||'Endereço não publicado'}</p></section>
   <section><h3><UserRound size={16}/>Responsável divulgado</h3><p>{lead.contact_name||'Nome não publicado nas fontes verificadas'}</p>{lead.contact_role&&<small>{lead.contact_role}</small>}</section>
  </div>
  <h3 className="contact-heading">Canais de contato</h3>
  <div className="company-contact-grid">
   {whatsapp?<a href={whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle size={19}/><span>WhatsApp comercial<strong>{lead.whatsapp}</strong></span><ArrowUpRight size={15}/></a>:<div className="unavailable-channel"><MessageCircle size={19}/><span>WhatsApp<strong>Não publicado ou não confirmado</strong></span></div>}
   {email?<a href={email}><Mail size={19}/><span>E-mail comercial<strong>{lead.email}</strong></span><ArrowUpRight size={15}/></a>:<div className="unavailable-channel"><Mail size={19}/><span>E-mail<strong>Não publicado nas fontes verificadas</strong></span></div>}
   {safeUrl(lead.instagram_url)?<a href={safeUrl(lead.instagram_url)} target="_blank" rel="noopener noreferrer"><Instagram size={19}/><span>Instagram<strong>Conhecer perfil da empresa</strong></span><ArrowUpRight size={15}/></a>:<div className="unavailable-channel"><Instagram size={19}/><span>Instagram<strong>Perfil ainda não confirmado</strong></span></div>}
   {safeUrl(lead.website)&&<a href={safeUrl(lead.website)} target="_blank" rel="noopener noreferrer"><ArrowUpRight size={19}/><span>Site oficial<strong>Visitar site da empresa</strong></span><ArrowUpRight size={15}/></a>}
   {lead.phone&&<div className="unavailable-channel"><Phone size={19}/><span>Telefone divulgado<strong>{lead.phone}</strong></span></div>}
  </div>
  <section className="company-sources"><h3><ShieldCheck size={16}/>Fontes e conferência</h3>
   <p>Consulta registrada em {new Date(lead.source_verified_at).toLocaleDateString('pt-BR')}. Confirme a disponibilidade diretamente com a empresa.</p>
   {safeUrl(lead.source_url)&&<a href={safeUrl(lead.source_url)} target="_blank" rel="noopener noreferrer">Fonte principal<ArrowUpRight size={13}/></a>}
   {sources.filter(s=>safeUrl(s.url)).map((s,i)=><a key={i} href={safeUrl(s.url)} target="_blank" rel="noopener noreferrer">{s.label||'Fonte complementar'}<ArrowUpRight size={13}/></a>)}
  </section>
  <p className="fine-print">O diretório divulga informações comerciais públicas. Não representa vínculo, recomendação ou garantia de atendimento.</p>
 </dialog>;
}
