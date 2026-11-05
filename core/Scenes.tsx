import { useState, type FormEvent } from 'react';
import { ArrowDown, ArrowUpRight, Search, ShieldCheck, MousePointer2, Network, Unlock, MapPin } from 'lucide-react';

export function CoreHero({count=0,sectors=0,onSearch}:{count?:number;sectors?:number;onSearch?:(query:string)=>void}){
 const [term,setTerm]=useState('');
 function search(event:FormEvent){event.preventDefault();onSearch?.(term);}
 return <section className="core-chapter core-hero" id="inicio" data-core-scene="hero">
  <div className="core-sticky">
   <div className="core-copy" data-core-copy="hero">
    <span className="eyebrow"><span className="status-dot"/>UMA REDE ABERTA A POSSIBILIDADES</span>
    <h1><span className="core-line"><span>Grandes negócios.</span></span><span className="core-line"><span>Novas <em>conexões.</em></span></span></h1>
    <p>Encontre empresas e contatos comerciais em um só lugar. Explore, converse e crie oportunidades. Livre para todo mundo.</p>
    <form className="hero-search" onSubmit={search}><Search size={20}/><input aria-label="O que você procura?" placeholder="Qual empresa ou serviço você procura?" value={term} onChange={e=>setTerm(e.target.value)}/><button type="submit" aria-label="Pesquisar no catálogo"><ArrowUpRight size={22}/></button></form>
    <div className="hero-actions-row"><a className="primary core-hero-cta" href="#empresas">Explorar empresas<ArrowUpRight size={17}/></a><span><Unlock size={14}/>Gratuito. Sem cadastro.</span></div>
    <div className="hero-proof-row"><span><strong>{count}</strong> empresas</span><span><strong>{sectors}</strong> áreas de atuação</span><span><ShieldCheck size={15}/>Fontes públicas</span></div>
   </div>
   <div className="core-instrument" aria-hidden="true"><span className="instrument-top">TRIUNEXA / CONNECTION ENGINE</span><span className="instrument-label instrument-a"><i/>EMPRESAS</span><span className="instrument-label instrument-b"><i/>PESSOAS</span><span className="instrument-label instrument-c"><i/>OPORTUNIDADES</span><div className="instrument-bottom"><span>NÚCLEO DE CONEXÕES</span><span>01 — ∞</span></div></div>
   <div className="core-scene-caption" aria-hidden="true"><span>01 / DESCUBRA O QUE VEM DEPOIS</span><span>EXPLORE A PLATAFORMA <ArrowDown size={13}/></span></div>
  </div>
 </section>;
}

export function ConnectionsScene(){return <section className="core-chapter core-connections" id="conexoes" data-core-scene="connections">
 <div className="core-sticky"><div className="core-copy" data-core-copy="connections">
  <div className="scene-intro"><span className="eyebrow">02 / SIMPLES DE EXPLORAR</span><h2>Da descoberta<br/>à <em>conversa.</em></h2><p>Menos barreiras entre você e a sua próxima oportunidade.</p></div>
  <div className="connection-steps"><article><span className="step-number">01</span><Search size={23}/><h3>Encontre seu caminho</h3><p>Busque pelo nome, pela região ou pelo ramo de atividade.</p></article><article><span className="step-number">02</span><Network size={23}/><h3>Conheça a empresa</h3><p>Abra a ficha e consulte os canais comerciais disponíveis.</p></article><article><span className="step-number">03</span><MousePointer2 size={23}/><h3>Comece uma conversa</h3><p>Acesse o WhatsApp, o site ou as redes sociais divulgadas.</p></article></div>
 </div></div>
 </section>;}

export function OpportunitiesScene({count,sectors}:{count:number;sectors:number}){return <section className="core-chapter core-opportunities" id="oportunidades" data-core-scene="opportunities">
 <div className="core-sticky"><div className="core-copy" data-core-copy="opportunities">
  <div className="scene-intro"><span className="eyebrow">04 / UMA REDE EM MOVIMENTO</span><h2>Conexões reais.<br/><em>Possibilidades abertas.</em></h2><p>Cada empresa é um novo caminho para encontrar serviços, parceiros e oportunidades.</p></div>
  <div className="core-stats"><div><span className="stat-index">01 / DIRETÓRIO</span><strong data-core-count={count}>{count}</strong><span>empresas no catálogo</span></div><div><span className="stat-index">02 / DIVERSIDADE</span><strong data-core-count={sectors}>{sectors}</strong><span>áreas disponíveis</span></div><div><span className="stat-index">03 / ACESSO</span><strong>100<span>%</span></strong><span>acesso gratuito</span></div></div>
  <p className="stats-note"><MapPin size={15}/>Números do catálogo atual. Consulte a fonte e a data de cada contato.</p>
 </div></div>
 </section>;}

export function FinalScene(){return <section className="core-chapter core-final" id="final" data-core-scene="final">
 <div className="core-sticky"><div className="core-copy" data-core-copy="final">
  <span className="eyebrow">05 / A PRÓXIMA CONEXÃO É SUA</span><h2>Seu próximo passo<br/>pode começar <em>aqui.</em></h2>
  <p>Uma rede gratuita para descobrir empresas, aproximar pessoas e fazer boas ideias acontecerem.</p>
  <a className="primary core-final-cta" href="#empresas">Encontrar minha próxima conexão<ArrowUpRight size={19}/></a>
 </div></div>
 </section>;}
