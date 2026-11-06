import { useEffect, type RefObject } from 'react';

/** Native scroll drives one scene. No wheel interception or synthetic scrolling. */
export function useOndaScroll(root: RefObject<HTMLDivElement | null>, enabled: boolean) {
  useEffect(() => {
    const element = root.current;
    const journey = element?.querySelector<HTMLElement>('.onda-hero-journey');
    const hero = element?.querySelector<HTMLElement>('.onda-hero');
    if (!element || !journey || !hero || !enabled) return;
    const accents = [...element.querySelectorAll<HTMLElement>('#apresentacao, #como-funciona, .onda-closing')];
    let frame = 0, dirty = true, start = 0, travel = 1, total = 1, last = -1;
    let sections: { node: HTMLElement; top: number; height: number }[] = [];
    const clamp = (value: number) => Math.max(0, Math.min(1, value));
    const render = () => {
      frame = 0;
      if (document.hidden) return;
      const scroll = window.scrollY;
      if (dirty) {
        // Cache layout reads; transforms below do not alter the layout measurements.
        start = journey.getBoundingClientRect().top + scroll;
        travel = Math.max(1, journey.offsetHeight - hero.offsetHeight, innerHeight * .65);
        total = Math.max(1, element.offsetTop + element.offsetHeight - innerHeight);
        sections = accents.map(node => ({ node, top: node.getBoundingClientRect().top + scroll, height: node.offsetHeight }));
        dirty = false;
      }
      const progress = clamp((scroll - start) / travel);
      element.style.setProperty('--hero-progress', progress.toFixed(4));
      element.style.setProperty('--page-progress', clamp(scroll / total).toFixed(4));
      for (const section of sections) {
        section.node.style.setProperty('--section-progress', clamp((scroll + innerHeight - section.top) / (innerHeight + section.height)).toFixed(4));
      }
      if (Math.abs(progress - last) > .0001) {
        element.dispatchEvent(new CustomEvent('onda-journey', { detail: progress }));
        last = progress;
      }
    };
    const schedule = () => { if (!frame && !document.hidden) frame = requestAnimationFrame(render); };
    const measure = () => { dirty = true; schedule(); };
    const visibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else measure(); };
    const resize = new ResizeObserver(measure);
    resize.observe(element); resize.observe(journey);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure, { passive: true });
    document.addEventListener('visibilitychange', visibility);
    schedule();
    return () => {
      cancelAnimationFrame(frame); resize.disconnect();
      window.removeEventListener('scroll', schedule); window.removeEventListener('resize', measure);
      document.removeEventListener('visibilitychange', visibility);
      element.style.removeProperty('--hero-progress'); element.style.removeProperty('--page-progress');
      accents.forEach(node => node.style.removeProperty('--section-progress'));
      element.dispatchEvent(new CustomEvent('onda-journey', { detail: 0 }));
    };
  }, [root, enabled]);
}
