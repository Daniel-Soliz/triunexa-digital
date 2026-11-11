// Notifica o administrador quando um feedback anonimo foi salvo com sucesso.
// Requer secrets RESEND_API_KEY e TRIUNEXA_FEEDBACK_FROM (remetente verificado).
// Nunca recebe nem envia texto arbitrario informado na chamada: consulta o registro
// privado, criado pela RPC com verificacao de sessao e limite unico por visita.
const PROJECT_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const FEEDBACK_TO = 'danielsoliz1973@gmail.com';

function allowedOrigin(origin:string|null) {
 if (!origin) return false;
 return origin === 'https://daniel-soliz.github.io' ||
   /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}
function cors(origin:string|null) {
 return {
  'Access-Control-Allow-Origin':allowedOrigin(origin)?origin!:'https://daniel-soliz.github.io',
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods':'POST, OPTIONS',
  'Vary':'Origin',
 };
}
function respond(body:Record<string,unknown>,status:number,origin:string|null) {
 return new Response(JSON.stringify(body),{status,headers:{...cors(origin),'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
}
function validUuid(id:unknown):id is string {
 return typeof id==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}
type Feedback = {id:string;message:string;rating:number;created_at:string;notification_status:string};
function databaseHeaders() {
 return {'apikey':SERVICE_ROLE,'Authorization':`Bearer ${SERVICE_ROLE}`,'Content-Type':'application/json','Accept':'application/json'};
}
async function patchStatus(id:string,status:string,extra:Record<string,unknown>={},onlyPending=false) {
 const suffix = onlyPending?'&notification_status=eq.pending':'';
 const url=`${PROJECT_URL}/rest/v1/truinexa_public_feedback?id=eq.${encodeURIComponent(id)}${suffix}&select=id`;
 const response=await fetch(url,{method:'PATCH',headers:{...databaseHeaders(),'Prefer':'return=representation'},body:JSON.stringify({notification_status:status,...extra})});
 if(!response.ok)throw new Error(`Falha ao atualizar estado: ${response.status}`);
 return await response.json() as Array<{id:string}>;
}
Deno.serve(async (req:Request) => {
 const origin=req.headers.get('origin');
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors(origin)});
 if(!allowedOrigin(origin))return respond({emailed:false,reason:'origin_not_allowed'},403,origin);
 if(req.method!=='POST')return respond({emailed:false,reason:'method_not_allowed'},405,origin);
 let payload:unknown;
 try {payload=await req.json();}catch{return respond({emailed:false,reason:'invalid_json'},400,origin);}
 const session=(payload as {session_id?:unknown}|null)?.session_id;
 if(!validUuid(session))return respond({emailed:false,reason:'invalid_session'},400,origin);
 if(!PROJECT_URL||!SERVICE_ROLE)return respond({emailed:false,reason:'server_configuration_missing'},503,origin);

 try {
  const url=`${PROJECT_URL}/rest/v1/truinexa_public_feedback?session_id=eq.${encodeURIComponent(session)}&select=id,message,rating,created_at,notification_status&limit=1`;
  const stored=await fetch(url,{headers:databaseHeaders()});
  if(!stored.ok)throw new Error(`Consulta do registro falhou: ${stored.status}`);
  const list=await stored.json() as Feedback[];
  const feedback=list[0];
  if(!feedback)return respond({emailed:false,reason:'feedback_not_found'},404,origin);
  if(Date.now()-new Date(feedback.created_at).getTime()>60*60*1000)return respond({emailed:false,reason:'feedback_expired'},403,origin);
  if(feedback.notification_status==='sent')return respond({emailed:true,already_sent:true},200,origin);
  if(feedback.notification_status!=='pending')return respond({emailed:false,reason:'already_processed'},200,origin);

  const apiKey=Deno.env.get('RESEND_API_KEY');
  const verifiedFrom=Deno.env.get('TRIUNEXA_FEEDBACK_FROM');
  if(!apiKey||!verifiedFrom)return respond({emailed:false,reason:'email_provider_not_configured'},200,origin);

  const locked=await patchStatus(feedback.id,'sending',{notification_attempted_at:new Date().toISOString()},true);
  if(!locked.length)return respond({emailed:false,reason:'already_processed'},200,origin);
  try {
   const sent=await fetch('https://api.resend.com/emails',{
    method:'POST',
    headers:{'Authorization':`Bearer ${apiKey}`,'Content-Type':'application/json','Idempotency-Key':`triunexa-feedback-${feedback.id}`},
    body:JSON.stringify({
     from:verifiedFrom,to:[FEEDBACK_TO],
     subject:`TRIUNEXA DIGITAL — novo feedback (${feedback.rating}/5)`,
     text:`Novo feedback recebido na TRIUNEXA DIGITAL\n\nAvaliação: ${feedback.rating}/5\nData: ${new Date(feedback.created_at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}\n\nComentário:\n${feedback.message}\n\nMensagem enviada pelo formulário público. Não responda diretamente a este e-mail.`
    }),
   });
   if(!sent.ok)throw new Error(`Provedor de e-mail retornou HTTP ${sent.status}`);
   await patchStatus(feedback.id,'sent',{notification_sent_at:new Date().toISOString(),notification_error:null});
   return respond({emailed:true},200,origin);
  }catch(error){
   await patchStatus(feedback.id,'failed',{notification_error:String(error).slice(0,350)}).catch(()=>{});
   return respond({emailed:false,reason:'delivery_failed'},200,origin);
  }
 }catch(error){
  console.error('Erro no encaminhamento de feedback:',error instanceof Error?error.message:'erro desconhecido');
  return respond({emailed:false,reason:'server_error'},500,origin);
 }
});
