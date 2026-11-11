import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from './publicApi';

interface Metrics { total:number; unique:number; online:number; today:number; since:string | null }
interface Feedback { id:string; message:string; rating:number; created_at:string; notification_status?:string; notification_sent_at?:string|null }
export default function AdminPanel() {
 const [owner,setOwner]=useState(false), [email,setEmail]=useState(''), [password,setPassword]=useState('');
 const [notice,setNotice]=useState(''), [busy,setBusy]=useState(false), [metrics,setMetrics]=useState<Metrics|null>(null);
 const [feedback,setFeedback]=useState<Feedback[]>([]), [recovery,setRecovery]=useState(false);
 async function refresh() {
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) {setOwner(false);setMetrics(null);setFeedback([]);return;}
  const {data,error}=await supabase.from('truinexa_platform_owners').select('user_id').eq('user_id',user.id).maybeSingle();
  if(error || !data) {setOwner(false);setMetrics(null);setFeedback([]);setNotice('Acesso exclusivo do administrador Daniel Soliz.');return;}
  setOwner(true);
  const [stats,messages]=await Promise.all([supabase.rpc('truinexa_public_metrics'),supabase.from('truinexa_public_feedback').select('id,message,rating,created_at,notification_status,notification_sent_at').order('created_at',{ascending:false}).limit(100)]);
  if(stats.error || messages.error) {setNotice('Não foi possível atualizar o painel. Tente novamente.');return;}
  setMetrics(stats.data);setFeedback(messages.data || []);
 }
 useEffect(()=>{
  void refresh();
  const {data:{subscription}}=supabase.auth.onAuthStateChange(event=>{
   if(event==='PASSWORD_RECOVERY') setRecovery(true);
   // Supabase auth callbacks must not await further auth calls.
   setTimeout(()=>void refresh(),0);
  });
  const timer=setInterval(()=>void refresh(),30000);
  return ()=>{subscription.unsubscribe();clearInterval(timer);};
 },[]);
 async function login(e:FormEvent) {
  e.preventDefault();setBusy(true);setNotice('');
  try { const {error}=await supabase.auth.signInWithPassword({email,password}); if(error) throw error; setPassword('');await refresh(); }
  catch {setNotice('Não foi possível entrar. Confira seu e-mail e senha.');} finally {setBusy(false);}
 }
 async function reset() {
  if(!email.includes('@')) {setNotice('Informe seu e-mail administrativo primeiro.');return;}
  setBusy(true);
  const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${location.origin}${import.meta.env.BASE_URL}recovery.html`});
  setNotice(error?'Não foi possível solicitar o link. Tente novamente.':'Se este e-mail tiver acesso, você receberá o link para definir sua senha.');setBusy(false);
 }
 async function changePassword(e:FormEvent) {
  e.preventDefault();setBusy(true);
  const {error}=await supabase.auth.updateUser({password});
  setNotice(error?'Não foi possível salvar a senha. Use pelo menos 12 caracteres.':'Senha atualizada.');
  if(!error){setPassword('');setRecovery(false);}setBusy(false);
 }
 return <main className="admin-shell">
  <a className="back-link" href="#">← Voltar ao catálogo público</a>
  <div className="section-heading"><div><span className="eyebrow">ÁREA EXCLUSIVA</span><h1>Painel do desenvolvedor</h1><p>Acessos e sugestões da comunidade.</p></div>{owner&&<button className="secondary" onClick={async()=>{await supabase.auth.signOut();setOwner(false);setMetrics(null);setFeedback([]);}}>Sair do painel</button>}</div>
  {notice&&<p role="status" className="notice">{notice}</p>}
  {(!owner || recovery) ? <form className="auth-card" onSubmit={recovery?changePassword:login}>
   <h2>{recovery?'Definir nova senha':'Olá, Daniel.'}</h2><p>O catálogo é livre. Este acesso é reservado à administração.</p>
   {!recovery&&<label>E-mail administrativo<input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required /></label>}
   <label>{recovery?'Nova senha':'Senha'}<input type="password" autoComplete={recovery?'new-password':'current-password'} minLength={recovery?12:1} value={password} onChange={e=>setPassword(e.target.value)} required /></label>
   <button className="primary" disabled={busy}>{busy?'Aguarde…':recovery?'Salvar nova senha':'Entrar no painel'}</button>
   {!recovery&&<button className="text-button" type="button" disabled={busy} onClick={()=>void reset()}>Definir ou recuperar minha senha</button>}
  </form> : <>
   <div className="metrics-grid">{[['Online agora',metrics?.online],['Visitas totais',metrics?.total],['Visitantes únicos',metrics?.unique],['Visitas hoje',metrics?.today]].map(([label,value])=><article className="metric" key={String(label)}><span>{label}</span><strong>{value===undefined?'—':Number(value).toLocaleString('pt-BR')}</strong></article>)}</div>
   <p className="fine-print">Online: navegadores ativos nos últimos 2 minutos. Visitas: sessões por aba; recarregar não soma outra visita. Únicos: estimativa por navegador, sujeita a cookies, armazenamento e bots. Hoje: horário de São Paulo. Contagem iniciada nesta versão.</p>
   <button className="secondary" onClick={()=>void refresh()}>Atualizar dados</button>
   <section className="feedback-list"><h2>Feedbacks da comunidade</h2><p>Últimas 100 mensagens · visíveis somente para você.</p>{feedback.length===0?<div className="empty-state">As primeiras sugestões vão aparecer aqui.</div>:feedback.map(f=><article key={f.id}><header><span>{'★'.repeat(f.rating)}{'☆'.repeat(5-f.rating)}</span><span className="feedback-email-status">{f.notification_status==='sent'?'E-mail enviado':f.notification_status==='failed'?'Falha no e-mail':f.notification_status==='sending'?'Encaminhando e-mail':'E-mail pendente'}</span><time>{new Date(f.created_at).toLocaleString('pt-BR')}</time></header><p>{f.message}</p></article>)}</section>
  </>}
 </main>;
}
