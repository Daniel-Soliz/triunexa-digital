import { ArrowDown, ArrowUpRight } from 'lucide-react';
export function CoreHero(){return <section className="core-chapter core-hero" id="inicio" data-core-scene="hero">
 <div className="core-sticky"><div className="core-copy" data-core-copy="hero">
  <span className="eyebrow">TRIUNEXA / CONEXÕES QUE ABREM PORTAS</span>
  <h1><span className="core-line"><span>O próximo passo</span></span><span className="core-line"><span>começa com</span></span><span className="core-line core-italic"><span>uma conexão.</span></span></h1>
  <p>Empresas reais. Contatos comerciais. Uma plataforma gratuita para transformar descobertas em oportunidades.</p>
  <a className="primary core-hero-cta" href="#empresas">Explorar empresas<ArrowUpRight size={17}/></a>
 </div><div className="core-scene-caption" aria-hidden="true"><span>01 / DESCOBERTA</span><span>ROLE PARA CONECTAR <ArrowDown size={12}/></span></div></div>
 </section>;}
export function ConnectionsScene(){return <section className="core-chapter" id="conexoes" data-core-scene="connections">
 <div className="core-sticky"><div className="core-copy" data-core-copy="connections">
  <span className="eyebrow">02 / ACESSO LIVRE</span>
  <h2><span className="core-line"><span>As melhores conexões</span></span><span className="core-line core-italic"><span>não têm barreiras.</span></span></h2>
  <p>Sem cadastro. Sem senha para explorar. Encontre negócios de diferentes áreas, consulte as fontes e escolha seu próximo contato.</p>
  <a className="core-text-link" href="#empresas">Conheça quem está na rede<ArrowUpRight size={16}/></a>
 </div><div className="core-scene-caption" aria-hidden="true"><span>NÓS / PESSOAS / POSSIBILIDADES</span><span>EXPLORE A REDE</span></div></div>
 </section>;}
export function OpportunitiesScene({count,sectors}:{count:number;sectors:number}){return <section className="core-chapter core-opportunities" id="oportunidades" data-core-scene="opportunities">
 <div className="core-sticky"><div className="core-copy" data-core-copy="opportunities">
  <span className="eyebrow">04 / NOVAS POSSIBILIDADES</span>
  <h2><span className="core-line"><span>Uma descoberta hoje.</span></span><span className="core-line core-italic"><span>Um novo caminho amanhã.</span></span></h2>
  <div className="core-stats"><div><strong data-core-count={count}>{count}</strong><span>empresas no catálogo</span></div><div><strong data-core-count={sectors}>{sectors}</strong><span>áreas disponíveis</span></div><div><strong>100%</strong><span>acesso gratuito</span></div></div>
  <p>Os números refletem o catálogo disponível. A data e a fonte de cada contato continuam visíveis na ficha da empresa.</p>
 </div><div className="core-scene-caption" aria-hidden="true"><span>04 / ATRAVESSE A REDE</span><span>CONHECER É O PRIMEIRO PASSO</span></div></div>
 </section>;}
export function FinalScene(){return <section className="core-chapter core-final" id="final" data-core-scene="final">
 <div className="core-sticky"><div className="core-copy" data-core-copy="final">
  <span className="eyebrow">05 / O PRÓXIMO PASSO É SEU</span>
  <h2><span className="core-line"><span>Conecte possibilidades.</span></span><span className="core-line core-italic"><span>Crie o que vem depois.</span></span></h2>
  <p>Uma rede aberta para quem quer descobrir empresas, encontrar serviços e criar oportunidades.</p>
  <a className="primary core-final-cta" href="#empresas">Encontrar minha próxima conexão<ArrowUpRight size={18}/></a>
 </div><div className="core-scene-caption" aria-hidden="true"><span>TRIUNEXA DIGITAL</span><span>DESENVOLVIDO POR DANIEL SOLIZ</span></div></div>
 </section>;}
