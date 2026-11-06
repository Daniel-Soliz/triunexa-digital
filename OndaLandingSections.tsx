import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Compass, Globe2, Menu, Pause, Play, Search, ShieldCheck, X } from 'lucide-react';
import { OndaOrb } from './OndaExperience';

type HeaderProps = { menuOpen: boolean; onToggleMenu: () => void; onCloseMenu: () => void; paused: boolean; reduced: boolean; onToggleMotion: () => void };

export function OndaHeader({ menuOpen, onToggleMenu, onCloseMenu, paused, reduced, onToggleMotion }: HeaderProps) {
  const navigation = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    navigation.current?.querySelector('a')?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      onCloseMenu(); menuButton.current?.focus();
    };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [menuOpen]);
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
      <nav ref={navigation} id="onda-navigation" aria-label="Navegação principal" className={menuOpen ? 'onda-nav is-open' : 'onda-nav'}>
        {links.map((link) => <a key={link.href} href={link.href} onClick={onCloseMenu}>{link.text}</a>)}
      </nav>
      <div className="onda-header-tools">
        <button className="onda-motion-button" type="button" onClick={onToggleMotion} disabled={reduced} aria-label={reduced ? 'Movimento reduzido ativado no sistema' : paused ? 'Retomar animações' : 'Pausar animações'} title={reduced ? 'Movimento reduzido ativado no sistema' : paused ? 'Retomar animações' : 'Pausar animações'} aria-pressed={paused || reduced}>
          {paused || reduced ? <Play size={15} aria-hidden="true"/> : <Pause size={15} aria-hidden="true"/>}
        </button>
        <a className="onda-pill onda-header-action" href="#empresas" onClick={onCloseMenu}>Explorar empresas<ArrowUpRight size={17} strokeWidth={1.8} aria-hidden="true"/></a>
      </div>
      <button ref={menuButton} className="onda-menu-button" type="button" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} aria-controls="onda-navigation" onClick={onToggleMenu}>
        {menuOpen ? <X size={24}/> : <Menu size={24}/>}
      </button>
    </header>
  );
}

type HeroProps = {
  count: number;
  sectors: number;
  onSearch: (query: string) => void;
  animated: boolean;
};

export function OndaHero({ count, sectors, onSearch, animated }: HeroProps) {
  const [searchTerm, setSearchTerm] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(searchTerm);
  }

  return (
    <div className="onda-hero-journey" id="inicio"><section className="onda-hero" aria-labelledby="onda-hero-title">
      <div className="onda-hero-atmosphere" aria-hidden="true"><div className="onda-nebula"><div className="onda-nebula-flow"/></div><div className="onda-coordinate-grid"/><div className="onda-starfield"/></div>
      <div className="onda-hero-copy">
        <h1 id="onda-hero-title" className="onda-hero-title">Boas conexões.<br/><span>Novas possibilidades.</span></h1>
        <p className="onda-hero-description">Descubra empresas, encontre o contato certo e transforme uma busca em uma nova oportunidade.</p>
        <form className="onda-hero-search" onSubmit={submit} role="search">
          <label htmlFor="onda-hero-query" className="onda-sr-only">O que você procura?</label>
          <Search size={20} aria-hidden="true"/>
          <input id="onda-hero-query" name="busca" type="search" autoComplete="off" placeholder="Empresa, serviço ou cidade…" value={searchTerm} onChange={event=>setSearchTerm(event.target.value)} />
          <button type="submit" aria-label="Pesquisar no catálogo"><ArrowRight size={20} aria-hidden="true"/></button>
        </form>
        <div className="onda-hero-assurance"><ShieldCheck size={15} aria-hidden="true"/><span>Aberta para todos. Sem cadastro e sem cobrança.</span></div>
      </div>
      <div className="onda-hero-stage" aria-hidden="true">
        <div className="onda-stage-glow"/>
        <span className="onda-orbit"><span className="onda-orbit-moon"/></span>
        <span className="onda-orbit onda-orbit-secondary"/>
        <OndaOrb animated={animated}/>
        <div className="onda-floating-note onda-note-discover"><span className="onda-note-icon"><Compass size={19}/></span><span>Encontre seu próximo contato<strong>Uma conexão muda tudo.</strong></span></div>
        <div className="onda-floating-note onda-note-open"><span className="onda-online-dot"/><span>Uma comunidade aberta<Globe2 size={15}/></span></div>
      </div>
      <div className="onda-hero-bottom">
        <div className="onda-hero-counter"><span><strong>{count}</strong> empresas para descobrir</span><span><strong>{sectors}</strong> áreas de atuação</span><span>100% gratuito</span></div>
        <a href="#apresentacao" className="onda-scroll-note">Continue explorando<ArrowDown size={17} aria-hidden="true"/></a>
      </div>
    </section></div>
  );
}

export function OndaIntroduction() {
  return (
    <section className="onda-introduction" id="apresentacao">
      <div className="onda-intro-symbol" aria-hidden="true"><ArrowUpRight size={60} strokeWidth={1}/></div>
      <h2>Uma boa conexão<br/>pode mudar tudo.</h2>
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
      <div className="onda-steps-heading"><h2>Como funciona<span>.</span></h2><p>Da descoberta à primeira conversa, sem barreiras desnecessárias.</p></div>
      <div className="onda-steps-grid">{steps.map((step)=><article className="onda-step" key={step.number}><span className="onda-step-number">{step.number} / 03</span><h3>{step.title}</h3><p>{step.copy}</p><ArrowUpRight className="onda-step-arrow" size={29} strokeWidth={1.4}/></article>)}</div>
    </section>
  );
}

export function OndaClosing() {
  return (
    <section className="onda-closing" aria-labelledby="onda-closing-title">
      <div className="onda-closing-orbits" aria-hidden="true"><i/><i/><i/></div>
      <h2 id="onda-closing-title">Sua próxima conexão<br/>começa aqui.</h2>
      <div className="onda-closing-bottom"><p>O próximo contato, serviço ou parceiro pode estar a uma descoberta de distância.</p><a className="onda-pill" href="#empresas"><span className="onda-pill-dot"/>Encontrar empresas<ArrowUpRight size={18}/></a></div>
    </section>
  );
}
