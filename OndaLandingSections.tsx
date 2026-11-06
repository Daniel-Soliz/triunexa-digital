import { useState, type FormEvent } from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Menu, Search, X } from 'lucide-react';

type HeaderProps = { menuOpen: boolean; onToggleMenu: () => void; onCloseMenu: () => void };

export function OndaHeader({ menuOpen, onToggleMenu, onCloseMenu }: HeaderProps) {
  const links = [
    { href: '#empresas', text: 'Catálogo' },
    { href: '#como-funciona', text: 'Como funciona' },
    { href: '#criador', text: 'O criador' },
  ];

  return (
    <header className="onda-header">
      <a href="#inicio" className="onda-brand" aria-label="TRIUNEXA DIGITAL, voltar ao início" onClick={onCloseMenu}>
        triunexa<span>.</span><small>DIGITAL</small>
      </a>
      <nav aria-label="Navegação principal" className={menuOpen ? 'onda-nav is-open' : 'onda-nav'}>
        {links.map((link) => <a key={link.href} href={link.href} onClick={onCloseMenu}>{link.text}</a>)}
      </nav>
      <a className="onda-pill onda-header-action" href="#empresas"><span className="onda-pill-dot"/>Explorar empresas<ArrowUpRight size={17} strokeWidth={1.8}/></a>
      <button className="onda-menu-button" type="button" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} onClick={onToggleMenu}>
        {menuOpen ? <X size={24}/> : <Menu size={24}/>}
      </button>
    </header>
  );
}

type HeroProps = {
  count: number;
  sectors: number;
  onSearch: (query: string) => void;
};

export function OndaHero({ count, sectors, onSearch }: HeroProps) {
  const [searchTerm, setSearchTerm] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(searchTerm);
  }

  return (
    <section className="onda-hero" id="inicio" aria-labelledby="onda-hero-title">
      <div className="onda-hero-intro">
        <span className="onda-overline">UMA COMUNIDADE ABERTA A NOVAS POSSIBILIDADES</span>
        <p>Somos a TRIUNEXA DIGITAL. Uma plataforma para descobrir empresas, encontrar contatos comerciais e criar conexões reais. Sem cadastro e sem cobrança.</p>
        <a href="#empresas" className="onda-text-link">Conheça o catálogo<ArrowRight size={20}/></a>
      </div>
      <div className="onda-hero-stage" aria-hidden="true">
        <span className="onda-orbit"><span className="onda-orbit-moon"/></span>
        <div className="onda-image-aperture"><img src={`${import.meta.env.BASE_URL}onda-orbit.jpg`} alt="" width="1200" height="1200" fetchPriority="high"/></div>
      </div>
      <h1 id="onda-hero-title" className="onda-hero-title"><span>Olá</span><em>.</em></h1>
      <div className="onda-hero-bottom">
        <div className="onda-hero-counter"><span>{count} empresas</span><span>{sectors} áreas de atuação</span><span>100% gratuito</span></div>
        <a href="#apresentacao" className="onda-scroll-note">DESCUBRA MAIS <ArrowDownRight size={16}/></a>
      </div>
      <form className="onda-hero-search" onSubmit={submit} role="search">
        <label htmlFor="onda-hero-query" className="onda-sr-only">O que você procura?</label>
        <Search size={20} aria-hidden="true"/>
        <input id="onda-hero-query" type="search" placeholder="Qual empresa ou serviço você procura?" value={searchTerm} onChange={event=>setSearchTerm(event.target.value)} aria-label="O que você procura?"/>
        <button type="submit" aria-label="Pesquisar no catálogo"><ArrowRight size={19}/></button>
      </form>
    </section>
  );
}

export function OndaIntroduction() {
  return (
    <section className="onda-introduction" id="apresentacao">
      <div className="onda-section-index">01 / POR QUE EXISTIMOS</div>
      <h2>Uma boa conexão pode mudar <span>tudo</span><b>.</b></h2>
      <div className="onda-intro-details">
        <p>Encontrar uma empresa não deveria ser complicado. Reunimos informações comerciais públicas em um catálogo feito para facilitar descobertas e aproximar pessoas.</p>
        <a className="onda-underline-link" href="#empresas">Explore as empresas<ArrowUpRight size={18}/></a>
      </div>
    </section>
  );
}

export function OndaHowItWorks() {
  const steps = [
    { number: '01', title: 'Descubra', copy: 'Busque pelo nome, ramo de atividade ou cidade e encontre empresas no catálogo.' },
    { number: '02', title: 'Conheça', copy: 'Abra a ficha da empresa e confira os canais comerciais e a fonte das informações.' },
    { number: '03', title: 'Conecte-se', copy: 'Entre em contato pelos canais públicos disponíveis e comece uma conversa.' },
  ];
  return (
    <section className="onda-steps" id="como-funciona">
      <div className="onda-section-index">03 / SIMPLES E DIRETO</div>
      <div className="onda-steps-heading"><h2>Como funciona<span>.</span></h2><p>Da descoberta à primeira conversa, sem barreiras desnecessárias.</p></div>
      <div className="onda-steps-grid">{steps.map((step)=><article className="onda-step" key={step.number}><span className="onda-step-number">{step.number} / 03</span><h3>{step.title}</h3><p>{step.copy}</p><ArrowUpRight className="onda-step-arrow" size={29} strokeWidth={1.4}/></article>)}</div>
    </section>
  );
}

export function OndaClosing() {
  return (
    <section className="onda-closing" aria-labelledby="onda-closing-title">
      <span className="onda-section-index">04 / SUA PRÓXIMA OPORTUNIDADE</span>
      <h2 id="onda-closing-title">Vamos nos conectar<span>?</span></h2>
      <div className="onda-closing-bottom"><p>O próximo contato, serviço ou parceiro pode estar a uma descoberta de distância.</p><a className="onda-pill" href="#empresas"><span className="onda-pill-dot"/>Encontrar empresas<ArrowUpRight size={18}/></a></div>
    </section>
  );
}
