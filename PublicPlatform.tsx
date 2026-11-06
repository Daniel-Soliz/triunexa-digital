import { lazy, Suspense, useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowUpRight, Search, MapPin, MessageCircle, Instagram, SlidersHorizontal, ShieldCheck } from 'lucide-react';
import { heartbeat, loadPublicLeads, safeUrl, supabase, visitorIds, type PublicLead } from './publicApi';
import './public-platform.css';
import './cinematic.css';
import './onda-landing.css';
import { OndaHeader, OndaHero, OndaIntroduction, OndaHowItWorks, OndaClosing } from './OndaLandingSections';
import CompanyDialog from './CompanyDialog';
import { BUSINESS_SECTORS, canonicalSector, rotateDaily } from './publicApi';
const AdminPanel=lazy(()=>import('./AdminPanel'));
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function SocialLinks() {return <div className="social-links"><a href="https://www.instagram.com/dsdigital.tech/" target="_blank" rel="noopener noreferrer"><Instagram size={15}/>@dsdigital.tech<ArrowUpRight size={14}/></a><a href="https://www.instagram.com/danielsoliz.ds/" target="_blank" rel="noopener noreferrer"><Instagram size={15}/>@danielsoliz.ds<ArrowUpRight size={14}/></a></div>;}
function FeedbackDialog({onClose}:{onClose:()=>void}) {
 const ref=useRef<HTMLDialogElement>(null), [message,setMessage]=useState(''), [rating,setRating]=useState(5), [busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[sent,setSent]=useState(false);
 useEffect(()=>{ref.current?.showModal();return ()=>ref.current?.close();},[]);
 async function submit(e:FormEvent) {
  e.preventDefault();setBusy(true);setNotice('');
  try {
   await heartbeat();
   const {error}=await supabase.rpc('truinexa_submit_feedback',{p_session:visitorIds().session,p_message:message.trim(),p_rating:rating});
   if(error) {if(error.code==='23505') setNotice('Você já enviou um feedback nesta visita. Obrigado!');else throw error;}
   else {setSent(true);setNotice('Obrigado por ajudar a plataforma a evoluir!');}
  }catch{setNotice('Não foi possível enviar. Sua mensagem foi mantida; tente novamente.');}finally{setBusy(false);}
 }
 return <dialog ref={ref} className="feedback-dialog" aria-labelledby="feedback-title" onCancel={onClose} onClick={e=>{if(e.target===ref.current) onClose();}}>
  <button className="dialog-close" aria-label="Fechar feedback" onClick={onClose}>×</button><span className="eyebrow">FEITA PARA A COMUNIDADE</span><h2 id="feedback-title">Sua opinião faz a diferença.</h2><p>O que podemos melhorar? Deixe uma sugestão para ajudar Daniel a construir uma plataforma cada vez melhor.</p>
  {notice&&<p role="status" className="notice">{notice}</p>}
  {!sent?<form onSubmit={submit}><label>Como foi sua experiência?<select value={rating} onChange={e=>setRating(Number(e.target.value))}>{[5,4,3,2,1].map(n=><option key={n} value={n}>{n} {n===1?'estrela':'estrelas'}</option>)}</select></label><label>Sua sugestão<textarea value={message} onChange={e=>setMessage(e.target.value)} minLength={10} maxLength={2000} required rows={4} placeholder="Conte o que gostou ou o que sentiu falta…" /></label><small>Sem cadastro. A mensagem será lida somente pelo administrador. Evite incluir dados pessoais.</small><div className="dialog-actions"><button className="text-button" type="button" onClick={onClose}>Agora não</button><button className="primary" disabled={busy || message.trim().length<10}>{busy?'Enviando…':'Enviar feedback'}</button></div></form>:<button className="primary" onClick={onClose}>Voltar à plataforma</button>}
 </dialog>;
}
function LeadCard({lead,onSelect}:{lead:PublicLead;onSelect:()=>void}) {
 const phone=(lead.whatsapp || '').replace(/\D/g,'');
 const whatsapp=/^\d{10,13}$/.test(phone)?`https://wa.me/${phone.startsWith('55')&&phone.length>=12?phone:`55${phone}`}`:undefined;
 return <article className="lead-card"><div className="card-top"><div className="company-monogram">{lead.company.slice(0,1)}</div><span className="segment-badge">{lead.segment || 'Empresa'}</span></div><h3><button className="company-open" onClick={onSelect} aria-label={"Ver informações de "+lead.company}>{lead.company}</button></h3><p className="location"><MapPin size={14}/>{[lead.neighborhood,lead.city,lead.state].filter(Boolean).join(' · ') || 'Localização não informada'}</p><p className="summary">{lead.company_summary || 'Conheça esta empresa e consulte os canais comerciais disponíveis.'}</p><div className="contact-links">{whatsapp&&<a className="whatsapp" href={whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle size={16}/>WhatsApp<ArrowUpRight size={14}/></a>}{safeUrl(lead.website)&&<a href={safeUrl(lead.website)} target="_blank" rel="noopener noreferrer">Site<ArrowUpRight size={14}/></a>}{safeUrl(lead.instagram_url)&&<a href={safeUrl(lead.instagram_url)} target="_blank" rel="noopener noreferrer">Instagram<ArrowUpRight size={14}/></a>}{!whatsapp&&lead.phone&&<span className="phone-label">{lead.phone}</span>}</div><button className="company-details-button" onClick={onSelect}>Ver catálogo de informações<ArrowUpRight size={14}/></button><a className="source-link" href={safeUrl(lead.source_url)} target="_blank" rel="noopener noreferrer"><ShieldCheck size={13}/>Fonte pública · {new Date(lead.source_verified_at).toLocaleDateString('pt-BR')}<ArrowUpRight size={12}/></a></article>;
}
export default function PublicPlatform() {
 const [admin,setAdmin]=useState(location.hash==='#adm'),[leads,setLeads]=useState<PublicLead[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const [selectedCompany,setSelectedCompany]=useState<PublicLead|null>(null);
 const [menuOpen,setMenuOpen]=useState(false);
 const [query,setQuery]=useState(''),[segment,setSegment]=useState(''),[city,setCity]=useState(''),[page,setPage]=useState(1),[feedback,setFeedback]=useState(false);
 async function load() {setLoading(true);setError('');try{setLeads(rotateDaily(await loadPublicLeads()));}catch{setError('Não foi possível carregar as empresas. Confira sua conexão e tente novamente.');}finally{setLoading(false);}}
 useEffect(()=>{
  const change=()=>setAdmin(location.hash==='#adm');window.addEventListener('hashchange',change);
  void load();const timer=setInterval(()=>void load(),120000);
  return ()=>{window.removeEventListener('hashchange',change);clearInterval(timer);};
 },[]);
 useEffect(()=>{
  if(admin)return;
  const beat=()=>{if(document.visibilityState==='visible') void heartbeat().catch(()=>{});};
  beat();const timer=setInterval(beat,30000);document.addEventListener('visibilitychange',beat);
  let seen=false;try{seen=sessionStorage.getItem('triunexa-feedback-prompt')==='1';}catch{}
  const prompt=seen?undefined:setTimeout(()=>{setFeedback(true);try{sessionStorage.setItem('triunexa-feedback-prompt','1');}catch{}},20000);
  return ()=>{clearInterval(timer);clearTimeout(prompt);document.removeEventListener('visibilitychange',beat);};
 },[admin]);
 useEffect(()=>setPage(1),[query,segment,city]);
 const filtered=leads.filter(l=>(!segment||canonicalSector(l.segment)===segment)&&(!city||l.city===city)&&normalize([l.company,l.segment,l.city,l.neighborhood].join(' ')).includes(normalize(query)));
 const segments=[...new Set([...BUSINESS_SECTORS,...leads.map(l=>canonicalSector(l.segment))])].sort(),cities=[...new Set(leads.map(l=>l.city).filter(Boolean))].sort();
 function searchFromHero(term:string) {
  setQuery(term);setSegment('');setCity('');
  location.hash='empresas';
  document.getElementById('empresas')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
 }
 return <div className={"public-platform"+(admin?" admin-view":" onda-view")}>
 {admin?<header className="site-header"><a href="#" className="brand"><span className="brand-symbol">t<span>.</span></span><span>triunexa<span className="brand-sub">DIGITAL / COMUNIDADE</span></span></a><nav><a href="#" className="nav-catalog">Catálogo público</a></nav></header>:<OndaHeader menuOpen={menuOpen} onToggleMenu={()=>setMenuOpen(open=>!open)} onCloseMenu={()=>setMenuOpen(false)}/>}
 {admin?<Suspense fallback={<p className="admin-shell">Carregando painel…</p>}><AdminPanel/></Suspense>:<main>
 <OndaHero count={leads.length} sectors={new Set(leads.map(l=>canonicalSector(l.segment))).size} onSearch={searchFromHero}/>
 <OndaIntroduction/>
 <section className="catalog" id="empresas"><div className="section-heading"><div><span className="eyebrow">02 / EXPLORE O DIRETÓRIO</span><h2>Encontre sua próxima conexão<span className="heading-dot">.</span></h2></div><span className="result-total">{loading?'Carregando catálogo…':`${leads.length} empresas disponíveis`}</span></div><div className="sector-rail" aria-label="Áreas de atuação">{BUSINESS_SECTORS.map(s=><button key={s} className={segment===s?"active":""} aria-pressed={segment===s} onClick={()=>setSegment(segment===s?"":s)}>{s}<span>{leads.filter(l=>canonicalSector(l.segment)===s).length}</span></button>)}</div><div className="filter-bar"><label className="search-field"><Search size={19}/><input aria-label="Buscar empresas" placeholder="Buscar empresa, segmento ou cidade" value={query} onChange={e=>setQuery(e.target.value)}/></label><label className="filter-field"><SlidersHorizontal size={16}/><select aria-label="Segmento" value={segment} onChange={e=>setSegment(e.target.value)}><option value="">Todos os segmentos</option>{segments.map(s=><option key={s}>{s}</option>)}</select></label><label className="filter-field"><MapPin size={16}/><select aria-label="Cidade" value={city} onChange={e=>setCity(e.target.value)}><option value="">Todas as cidades</option>{cities.map(c=><option key={c}>{c}</option>)}</select></label></div>
 <div className="results-meta"><span>{filtered.length} {filtered.length===1?'conexão encontrada':'conexões encontradas'}</span>{(query||segment||city)?<button className="clear-filters" onClick={()=>{setQuery('');setSegment('');setCity('');}}>Limpar filtros ×</button>:<span>Escolha uma empresa. Comece uma conversa.</span>}</div>
 {error?<div className="empty-state" role="alert"><p>{error}</p><button className="secondary" onClick={()=>void load()}>Tentar novamente</button></div>:loading&&leads.length===0?<div className="empty-state" role="status">Buscando novas conexões…</div>:filtered.length===0?<div className="empty-state"><h3>Nenhum resultado por aqui</h3><p>Tente outro termo ou explore todos os segmentos.</p><button className="secondary" onClick={()=>{setQuery('');setCity('');setSegment('');}}>Limpar filtros</button></div>:<><div className="leads-grid">{filtered.slice(0,page*12).map(l=><LeadCard key={l.id} lead={l} onSelect={()=>setSelectedCompany(l)}/>)}</div>{filtered.length>page*12&&<div className="load-more"><button className="secondary" onClick={()=>setPage(p=>p+1)}>Ver mais empresas</button></div>}</>}
 <p className="catalog-note">A ordem de descoberta varia diariamente; isso não altera a data da última verificação. Os contatos podem mudar. Consulte a ficha e confirme os dados na fonte.</p></section>
 <OndaHowItWorks/>
 <OndaClosing/>
 <section className="creator" id="criador"><div className="creator-avatar">DS<span>↗</span></div><div className="creator-copy"><span className="eyebrow">05 / POR TRÁS DA PLATAFORMA</span><h2>Desenvolvido por Daniel Soliz.</h2><p>Tecnologia para aproximar pessoas e oportunidades. Acompanhe os próximos projetos e ajude esta comunidade a crescer.</p><SocialLinks/></div><button className="secondary" onClick={()=>setFeedback(true)}><MessageCircle size={16}/>Deixar feedback</button></section></main>}
 <footer className="site-footer"><span>© {new Date().getFullYear()} TRIUNEXA DIGITAL <span className="footer-divider">/</span> Desenvolvido por Daniel Soliz</span><a href={admin?'#':'#adm'}>{admin?'Catálogo público':'Acesso ADM'}<ArrowUpRight size={13}/></a></footer>
 {!admin&&selectedCompany&&<CompanyDialog lead={selectedCompany} onClose={()=>setSelectedCompany(null)}/>}
 {!admin&&!selectedCompany&&feedback&&<FeedbackDialog onClose={()=>{setFeedback(false);try{sessionStorage.setItem('triunexa-feedback-prompt','1');}catch{}}}/>}
 </div>;
}
