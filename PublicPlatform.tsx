import { lazy, Suspense, useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowUpRight, Search, MapPin, MessageCircle, Instagram, SlidersHorizontal, ShieldCheck } from 'lucide-react';
import { heartbeat, loadPublicLeads, claimPublicLead, supabase, visitorIds, type PublicLead } from './publicApi';
import './public-platform.css';
import './cinematic.css';
import './onda-landing.css';
import './onda-experience.css';
import { useOndaExperience } from './OndaExperience';
import { OndaHeader, OndaHero, OndaIntroduction, OndaHowItWorks, OndaClosing } from './OndaLandingSections';
import CompanyDialog from './CompanyDialog';
import { BUSINESS_SECTORS, canonicalSector, rotateDaily } from './publicApi';
const AdminPanel=lazy(()=>import('./AdminPanel'));
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function SocialLinks() {return <div className="social-links"><a href="https://www.instagram.com/dsdigital.tech/" target="_blank" rel="noopener noreferrer"><Instagram size={15}/>@dsdigital.tech<ArrowUpRight size={14}/></a><a href="https://www.instagram.com/danielsoliz.ds/" target="_blank" rel="noopener noreferrer"><Instagram size={15}/>@danielsoliz.ds<ArrowUpRight size={14}/></a></div>;}
function FeedbackDialog({onClose}:{onClose:()=>void}) {
 const ref=useRef<HTMLDialogElement>(null), [message,setMessage]=useState(''), [rating,setRating]=useState(5), [busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[sent,setSent]=useState(false);
 useEffect(()=>{ref.current?.showModal();return ()=>ref.current?.close();},[]);
 useEffect(()=>{if(!sent)return;const timer=setTimeout(onClose,4000);return()=>clearTimeout(timer);},[sent,onClose]);
 async function submit(e:FormEvent) {
  e.preventDefault();setBusy(true);setNotice('');
  try {
   await heartbeat();
   const {error}=await supabase.rpc('truinexa_submit_feedback',{p_session:visitorIds().session,p_message:message.trim(),p_rating:rating});
   if(error) {if(error.code==='23505') setNotice('Você já enviou um feedback nesta visita. Obrigado!');else throw error;}
   else {
    setSent(true);
    setNotice('Feedback registrado! Obrigado por ajudar a TRIUNEXA a evoluir.');
    // O registro no banco nao depende do servidor de notificacoes.
    void supabase.functions.invoke('truinexa-feedback-notify', {
      body:{session_id:visitorIds().session}
    }).catch(()=>{ /* O feedback permanece disponivel no ADM. */ });
   }
  }catch{setNotice('Não foi possível enviar. Sua mensagem foi mantida; tente novamente.');}finally{setBusy(false);}
 }
 return <dialog ref={ref} className="feedback-dialog" aria-labelledby="feedback-title" onCancel={onClose} onClick={e=>{if(e.target===ref.current) onClose();}}>
  <button className="dialog-close" aria-label="Fechar feedback" onClick={onClose}>×</button><span className="eyebrow">SUA EXPERIÊNCIA IMPORTA</span><h2 id="feedback-title">Como está sendo sua experiência?</h2><p>Você está gostando da TRIUNEXA? Conte o que funciona bem ou o que podemos melhorar. A participação é opcional.</p>
  {notice&&<p role="status" className="notice">{notice}</p>}
  {!sent?<form onSubmit={submit}><label>Como foi sua experiência?<select value={rating} onChange={e=>setRating(Number(e.target.value))}>{[[5,'Gostei muito'],[4,'Gostei'],[3,'Regular'],[2,'Precisa melhorar'],[1,'Não gostei']].map(([n,label])=><option key={n} value={n}>{n} estrelas — {label}</option>)}</select></label><label>Comentário ou sugestão<textarea value={message} onChange={e=>setMessage(e.target.value)} minLength={10} maxLength={2000} required rows={4} placeholder="O que você gostou? O que podemos melhorar na plataforma?" /></label><small>Sem cadastro. A mensagem será lida somente pelo administrador. Evite incluir dados pessoais.</small><div className="dialog-actions"><button className="text-button" type="button" onClick={onClose}>Agora não</button><button className="primary" disabled={busy || message.trim().length<10}>{busy?'Enviando…':'Enviar feedback'}</button></div></form>:<button className="primary" onClick={onClose}>Continuar navegando</button>}
 </dialog>;
}
function LeadCard({lead,onSelect,busy}:{lead:PublicLead;onSelect:()=>void;busy:boolean}) {
 return <article className="lead-card">
  <div className="card-top"><div className="company-monogram">{lead.company.slice(0,1)}</div><span className="segment-badge">{lead.segment || 'Empresa'}</span></div>
  <h3><button className="company-open" onClick={onSelect} disabled={busy} aria-label={"Ver informações de "+lead.company}>{lead.company}</button></h3>
  <p className="location"><MapPin size={14}/>{[lead.neighborhood,lead.city,lead.state].filter(Boolean).join(' · ') || 'Localização não informada'}</p>
  <p className="summary">{lead.company_summary || 'Consulte os canais comerciais da empresa após reservar.'}</p>
  <div className="contact-links"><span className="phone-label">Telefone, WhatsApp, Instagram e site na ficha reservada</span></div>
  <button className="company-details-button" disabled={busy} onClick={onSelect}>{busy?'Reservando contato…':'Reservar e ver informações'}<ArrowUpRight size={14}/></button>
  <span className="source-link"><ShieldCheck size={13}/>Informações obtidas em fontes públicas · {lead.source_verified_at?new Date(lead.source_verified_at).toLocaleDateString('pt-BR'):'data não informada'}</span>
 </article>;
}
export default function PublicPlatform() {
 const [admin,setAdmin]=useState(location.hash==='#adm'),[leads,setLeads]=useState<PublicLead[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const [selectedCompany,setSelectedCompany]=useState<PublicLead|null>(null);
 const [selectingId,setSelectingId]=useState(''),[selectionError,setSelectionError]=useState('');
 const [menuOpen,setMenuOpen]=useState(false);
 const fallbackFeedbackSeconds=useRef(0);
 const experience = useOndaExperience(!admin);
 const [query,setQuery]=useState(''),[segment,setSegment]=useState(''),[city,setCity]=useState(''),[page,setPage]=useState(1),[feedback,setFeedback]=useState(false);
 async function load() {setLoading(true);setError('');try{setLeads(rotateDaily(await loadPublicLeads()));}catch{setError('Não foi possível carregar as empresas. Confira sua conexão e tente novamente.');}finally{setLoading(false);}}
 async function selectLead(lead:PublicLead) {
  if(selectingId)return;
  setSelectingId(lead.id);setSelectionError('');
  try {const reserved=await claimPublicLead(lead.id);if(reserved)setSelectedCompany(reserved);
   else {setSelectionError('Esta empresa já foi reservada por outro visitante. O catálogo foi atualizado.');await load();}
  } catch {setSelectionError('Não foi possível reservar a empresa. Tente novamente.');}
  finally {setSelectingId('');}
 }
 useEffect(()=>{
  const change=()=>setAdmin(location.hash==='#adm');window.addEventListener('hashchange',change);
  void load();const timer=setInterval(()=>void load(),120000);
  let brazilDay=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo'}).format(new Date());
  const midnight=setInterval(()=>{const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo'}).format(new Date());if(today!==brazilDay){brazilDay=today;setSelectedCompany(null);void load();}},15000);
  return ()=>{window.removeEventListener('hashchange',change);clearInterval(timer);clearInterval(midnight);};
 },[]);
 useEffect(()=>{
  if(admin)return;
  const beat=()=>{if(document.visibilityState==='visible') void heartbeat().catch(()=>{});};
  beat();const timer=setInterval(beat,30000);document.addEventListener('visibilitychange',beat);
  // Contabiliza um minuto de uso visivel, inclusive se a pagina recarregar.
  // Nunca interrompe a ficha de uma empresa nem aparece duas vezes na visita.
  const promptTimer=setInterval(()=>{
   if(document.visibilityState!=='visible')return;
   try {
    if(sessionStorage.getItem('triunexa-feedback-prompt')==='1')return;
    const elapsed=Math.max(0,Number(sessionStorage.getItem('triunexa-feedback-active-ms')||'0'))+1000;
    sessionStorage.setItem('triunexa-feedback-active-ms',String(elapsed));
    if(elapsed>=60000 && !selectedCompany && !feedback){
     sessionStorage.setItem('triunexa-feedback-prompt','1');
     setFeedback(true);
    }
   } catch {
    // Se o armazenamento for bloqueado, ainda mostra o convite uma vez por sessao da pagina.
    fallbackFeedbackSeconds.current+=1;
    if(fallbackFeedbackSeconds.current>=60 && !selectedCompany && !feedback){
     fallbackFeedbackSeconds.current=-1000000;
     setFeedback(true);
    }
   }
  },1000);
  return ()=>{clearInterval(timer);clearInterval(promptTimer);document.removeEventListener('visibilitychange',beat);};
 },[admin,selectedCompany,feedback]);
 useEffect(()=>setPage(1),[query,segment,city]);
 const filtered=leads.filter(l=>(!segment||canonicalSector(l.segment)===segment)&&(!city||l.city===city)&&normalize([l.company,l.segment,l.city,l.neighborhood].join(' ')).includes(normalize(query)));
 const segments=[...new Set([...BUSINESS_SECTORS,...leads.map(l=>canonicalSector(l.segment))])].sort(),cities=[...new Set(leads.map(l=>l.city).filter(Boolean))].sort();
 function searchFromHero(term:string) {
  setQuery(term);setSegment('');setCity('');
  location.hash='empresas';
  document.getElementById('empresas')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
 }
 return <div ref={experience.root} data-motion={experience.mode} className={"public-platform"+(admin?" admin-view":" onda-view")}>
 {!admin&&<a className="onda-skip-link" href="#conteudo">Pular para o conteúdo</a>}
 {!admin&&<div className="onda-page-progress" aria-hidden="true"/>}
 {admin?<header className="site-header"><a href="#" className="brand"><span className="brand-symbol">t<span>.</span></span><span>triunexa<span className="brand-sub">DIGITAL / COMUNIDADE</span></span></a><nav><a href="#" className="nav-catalog">Catálogo público</a></nav></header>:<OndaHeader menuOpen={menuOpen} onToggleMenu={()=>setMenuOpen(open=>!open)} onCloseMenu={()=>setMenuOpen(false)} paused={experience.paused} reduced={experience.reduced} onToggleMotion={experience.toggleMotion}/>}
 {admin?<Suspense fallback={<p className="admin-shell">Carregando painel…</p>}><AdminPanel/></Suspense>:<main id="conteudo" tabIndex={-1}>
 <OndaHero count={leads.length} sectors={new Set(leads.map(l=>canonicalSector(l.segment))).size} onSearch={searchFromHero} animated={experience.animated}/>
 <OndaIntroduction/>
 <section className="catalog" id="empresas"><div className="section-heading"><div><h2>Encontre sua próxima conexão<span className="heading-dot">.</span></h2></div><span className="result-total">{loading?'Carregando catálogo…':`${leads.length} empresas disponíveis`}</span></div><div className="sector-rail" aria-label="Áreas de atuação">{BUSINESS_SECTORS.map(s=><button key={s} className={segment===s?"active":""} aria-pressed={segment===s} onClick={()=>setSegment(segment===s?"":s)}>{s}<span>{leads.filter(l=>canonicalSector(l.segment)===s).length}</span></button>)}</div><div className="filter-bar"><label className="search-field"><Search size={19}/><input aria-label="Buscar empresas" placeholder="Buscar empresa, segmento ou cidade" value={query} onChange={e=>setQuery(e.target.value)}/></label><label className="filter-field"><SlidersHorizontal size={16}/><select aria-label="Segmento" value={segment} onChange={e=>setSegment(e.target.value)}><option value="">Todos os segmentos</option>{segments.map(s=><option key={s}>{s}</option>)}</select></label><label className="filter-field"><MapPin size={16}/><select aria-label="Cidade" value={city} onChange={e=>setCity(e.target.value)}><option value="">Todas as cidades</option>{cities.map(c=><option key={c}>{c}</option>)}</select></label></div>
 <div className="results-meta"><span>{filtered.length} {filtered.length===1?'conexão encontrada':'conexões encontradas'}</span>{(query||segment||city)?<button className="clear-filters" onClick={()=>{setQuery('');setSegment('');setCity('');}}>Limpar filtros ×</button>:<span>Escolha uma empresa. Comece uma conversa.</span>}</div>
 {selectionError&&<div className="empty-state" role="status">{selectionError}</div>}
 {error?<div className="empty-state" role="alert"><p>{error}</p><button className="secondary" onClick={()=>void load()}>Tentar novamente</button></div>:loading&&leads.length===0?<div className="empty-state" role="status">Buscando novas conexões…</div>:filtered.length===0?<div className="empty-state"><h3>Nenhum resultado por aqui</h3><p>Tente outro termo ou explore todos os segmentos.</p><button className="secondary" onClick={()=>{setQuery('');setCity('');setSegment('');}}>Limpar filtros</button></div>:<><div className="leads-grid">{filtered.slice(0,page*12).map(l=><LeadCard key={l.id} lead={l} busy={selectingId===l.id} onSelect={()=>void selectLead(l)}/>)}</div>{filtered.length>page*12&&<div className="load-more"><button className="secondary" onClick={()=>setPage(p=>p+1)}>Ver mais empresas</button></div>}</>}
 <p className="catalog-note">Até 50 empresas por setor, conforme a disponibilidade de contatos verificados. A reserva é exclusiva por navegador e a vitrine é renovada à meia-noite (horário de Brasília). Os dados comerciais podem mudar; confirme nas fontes.</p></section>
 <OndaHowItWorks/>
 <OndaClosing/>
 <section className="creator" id="criador"><div className="creator-avatar">DS<span>↗</span></div><div className="creator-copy"><h2>Desenvolvido por Daniel Soliz.</h2><p>Tecnologia para aproximar pessoas e oportunidades. Acompanhe os próximos projetos e ajude esta comunidade a crescer.</p><SocialLinks/></div><button className="secondary" onClick={()=>setFeedback(true)}><MessageCircle size={16}/>Deixar feedback</button></section></main>}
 {!admin&&<a className="triunexa-whatsapp-float" href={`https://wa.me/5511932240546?text=${encodeURIComponent('Olá, Daniel! Conheci a TRIUNEXA DIGITAL e gostaria de conversar sobre criação de sites ou tirar uma dúvida.')}`} target="_blank" rel="noopener noreferrer" aria-label="Falar no WhatsApp com Daniel sobre criação de sites e serviços digitais">
  <span className="triunexa-whatsapp-copy"><strong>Precisa de um site?</strong><small>WhatsApp · DS Digital</small></span>
  <span className="triunexa-whatsapp-icon"><MessageCircle size={27} strokeWidth={2.2}/></span>
 </a>}
 <footer className="site-footer"><span>© {new Date().getFullYear()} TRIUNEXA DIGITAL <span className="footer-divider">/</span> Desenvolvido por Daniel Soliz</span><a href={admin?'#':'#adm'}>{admin?'Catálogo público':'Acesso ADM'}<ArrowUpRight size={13}/></a></footer>
 {!admin&&selectedCompany&&<CompanyDialog lead={selectedCompany} onClose={()=>setSelectedCompany(null)}/>}
 {!admin&&!selectedCompany&&feedback&&<FeedbackDialog onClose={()=>{setFeedback(false);try{sessionStorage.setItem('triunexa-feedback-prompt','1');}catch{}}}/>}
 </div>;
}
