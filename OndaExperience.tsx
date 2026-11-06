import { useEffect, useRef, useState } from 'react';
import { useOndaScroll } from './OndaScroll';

/** Motion is decorative: navigation, content and data never depend on it. */
export function useOndaExperience(active: boolean) {
  const root = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(() => {
    try { return localStorage.getItem('triunexa-motion-paused') === '1'; } catch { return false; }
  });
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const mode = reduced ? 'reduced' : paused ? 'paused' : 'full';
  useOndaScroll(root, active && mode === 'full');

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    try { localStorage.setItem('triunexa-motion-paused', paused ? '1' : '0'); } catch { /* Storage is optional. */ }
  }, [paused]);

  useEffect(() => {
    const element = root.current;
    const hero = element?.querySelector('.onda-hero');
    if (!active || !element || !hero) return;
    let visible = true;
    const update = () => { element.dataset.sceneActive = String(visible && !document.hidden); };
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; update(); });
    observer.observe(hero);
    document.addEventListener('visibilitychange', update);
    update();
    return () => {
      observer.disconnect(); document.removeEventListener('visibilitychange', update);
      delete element.dataset.sceneActive;
    };
  }, [active]);

  useEffect(() => {
    const element = root.current;
    if (!active || !element || mode !== 'full' || !matchMedia('(pointer: fine)').matches) return;
    let frame = 0;
    let x = 0, y = 0, clientX = 0, clientY = 0;
    let card: HTMLElement | null = null;
    let previousCard: HTMLElement | null = null;

    const resetCard = (target: HTMLElement | null) => {
      target?.style.removeProperty('--card-x');
      target?.style.removeProperty('--card-y');
      target?.style.removeProperty('--light-x');
      target?.style.removeProperty('--light-y');
    };
    const draw = () => {
      frame = 0;
      // Read before writing so pointer events never create a layout feedback loop.
      const rect = card?.getBoundingClientRect();
      element.style.setProperty('--pointer-x', x.toFixed(3));
      element.style.setProperty('--pointer-y', y.toFixed(3));
      if (previousCard !== card) resetCard(previousCard);
      if (card && rect) {
        const px = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const py = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
        card.style.setProperty('--card-x', `${((py - .5) * -5).toFixed(2)}deg`);
        card.style.setProperty('--card-y', `${((px - .5) * 5).toFixed(2)}deg`);
        card.style.setProperty('--light-x', `${px * 100}%`);
        card.style.setProperty('--light-y', `${py * 100}%`);
      }
      previousCard = card;
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || document.querySelector('dialog[open]')) return;
      clientX = event.clientX; clientY = event.clientY;
      x = (clientX / innerWidth - .5) * 2;
      y = (clientY / innerHeight - .5) * 2;
      card = event.target instanceof Element ? event.target.closest<HTMLElement>('.lead-card, .onda-step') : null;
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const leave = () => {
      x = 0; y = 0; card = null;
      if (!frame) frame = requestAnimationFrame(draw);
    };
    element.addEventListener('pointermove', move, { passive: true });
    element.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(frame);
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerleave', leave);
      element.style.removeProperty('--pointer-x');
      element.style.removeProperty('--pointer-y');
      resetCard(previousCard); resetCard(card);
    };
  }, [active, mode]);

  return { root, paused, reduced, mode, animated: active && mode === 'full', toggleMotion: () => setPaused(value => !value) };
}

const VERTEX = `attribute vec2 position;
void main() { gl_Position = vec4(position, 0., 1.); }`;

// A small, self-contained material study: one sculptural loop, not a particle wallpaper.
const FRAGMENT = `precision mediump float;
uniform vec2 resolution;
uniform vec2 pointer;
uniform float time;
uniform float journey;
mat2 rotate(float a) { float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }
vec3 world(vec3 p) {
  p.xy=rotate(-.46+pointer.x*.18+journey*.85)*p.xy;
  p.yz=rotate(.53+pointer.y*.22-journey*.48)*p.yz;
  p.xz=rotate(.22+sin(time*.19)*.13)*p.xz;
  return p;
}
float shape(vec3 position) {
  vec3 p=world(position);
  float angle=atan(p.y,p.x);
  float radius=.87+.055*sin(angle*3.+time*.28);
  vec2 q=vec2(length(p.xy)-radius,p.z);
  q=rotate(angle*1.5+time*.13)*q;
  return length(q*vec2(1.,1.14))-.255-.012*sin(angle*52.+q.x*9.);
}
void main() {
  vec2 uv=(gl_FragCoord.xy*2.-resolution)/min(resolution.x,resolution.y);
  vec3 origin=vec3(0.,0.,3.65-journey*.4);
  vec3 ray=normalize(vec3(uv,-2.6));
  float distance=0.;
  vec3 p=origin;
  bool hit=false;
  for(int i=0;i<64;i++) {
    p=origin+ray*distance;
    float stepSize=shape(p);
    if(stepSize<.002) { hit=true; break; }
    distance+=stepSize*.78;
    if(distance>6.) break;
  }
  if(!hit) { gl_FragColor=vec4(0.); return; }
  vec2 e=vec2(.003,0.);
  vec3 normal=normalize(vec3(shape(p+e.xyy)-shape(p-e.xyy),shape(p+e.yxy)-shape(p-e.yxy),shape(p+e.yyx)-shape(p-e.yyx)));
  vec3 view=-ray;
  vec3 reflected=reflect(ray,normal);
  float diffuse=max(dot(normal,normalize(vec3(-2.,3.,4.))),0.);
  float fresnel=pow(1.-max(dot(normal,view),0.),2.6);
  float stripe=pow(.5+.5*sin(reflected.y*12.+reflected.x*5.+time*.14),12.);
  float specular=pow(max(dot(reflect(-normalize(vec3(-2.,3.,4.)),normal),view),0.),48.);
  vec3 violet=vec3(.32,.095,.74);
  vec3 ice=vec3(.5,.86,1.);
  vec3 base=mix(violet,vec3(.66,.42,1.),diffuse*.78);
  base=mix(base,ice,smoothstep(-.2,.9,reflected.y)*.72);
  vec3 color=base*(.24+diffuse*.55)+stripe*vec3(.51,.4,.8)+specular*.9+fresnel*vec3(.35,.24,.66);
  color=pow(color,vec3(.86));
  gl_FragColor=vec4(color,1.);
}`;

export function OndaOrb({ animated }: { animated: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const [renderer, setRenderer] = useState('fallback');
  const animation = useRef(animated);
  const scheduling = useRef<{ resume: () => void; stop: () => void } | null>(null);

  useEffect(() => {
    animation.current = animated;
    if (animated) scheduling.current?.resume();
    else scheduling.current?.stop();
  }, [animated]);

  useEffect(() => {
    const surface = canvas.current, host = container.current;
    if (!surface || !host) return;
    let gl: WebGLRenderingContext | null = null;
    try { gl = surface.getContext('webgl', { alpha: true, antialias: false, powerPreference: 'low-power', premultipliedAlpha: false }); } catch { /* Still image remains visible. */ }
    if (!gl) return;
    const context = gl;
    const compile = (type: number, source: string) => {
      const shader = context.createShader(type);
      if (!shader) return null;
      context.shaderSource(shader, source); context.compileShader(shader);
      if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) { context.deleteShader(shader); return null; }
      return shader;
    };
    const vertex = compile(context.VERTEX_SHADER, VERTEX);
    const fragment = compile(context.FRAGMENT_SHADER, FRAGMENT);
    const program = context.createProgram();
    if (!vertex || !fragment || !program) {
      if (vertex) context.deleteShader(vertex);
      if (fragment) context.deleteShader(fragment);
      if (program) context.deleteProgram(program);
      return;
    }
    context.attachShader(program, vertex); context.attachShader(program, fragment); context.linkProgram(program);
    if (!context.getProgramParameter(program, context.LINK_STATUS)) {
      context.deleteProgram(program); context.deleteShader(vertex); context.deleteShader(fragment); return;
    }
    const buffer = context.createBuffer();
    context.bindBuffer(context.ARRAY_BUFFER, buffer);
    context.bufferData(context.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), context.STATIC_DRAW);
    context.useProgram(program);
    const position = context.getAttribLocation(program, 'position');
    context.enableVertexAttribArray(position); context.vertexAttribPointer(position, 2, context.FLOAT, false, 0, 0);
    const sizeUniform = context.getUniformLocation(program, 'resolution');
    const timeUniform = context.getUniformLocation(program, 'time');
    const pointerUniform = context.getUniformLocation(program, 'pointer');
    const journeyUniform = context.getUniformLocation(program, 'journey');
    let frame = 0, visible = false, lost = false, previous = 0, elapsed = 0, sizeDirty = true;
    let pointerX = 0, pointerY = 0, targetX = 0, targetY = 0;
    let journeyPosition = 0, targetJourney = 0;
    const coarse = matchMedia('(pointer: coarse)').matches;
    const draw = () => {
      pointerX += (targetX - pointerX) * .065;
      pointerY += (targetY - pointerY) * .065;
      journeyPosition += (targetJourney - journeyPosition) * .085;
      context.uniform2f(sizeUniform, surface.width, surface.height);
      context.uniform2f(pointerUniform, pointerX, pointerY);
      context.uniform1f(timeUniform, elapsed);
      context.uniform1f(journeyUniform, journeyPosition);
      context.drawArrays(context.TRIANGLES, 0, 6);
    };
    const render = (now: number) => {
      frame = 0;
      if (!animation.current || !visible || document.hidden || lost) { previous = 0; return; }
      if (!previous || now - previous >= 1000 / (coarse ? 24 : 40)) {
        elapsed += previous ? Math.min((now - previous) / 1000, .1) : 0;
        previous = now; draw();
      }
      frame = requestAnimationFrame(render);
    };
    const resume = () => { if (!frame && animation.current && visible && !document.hidden && !lost) frame = requestAnimationFrame(render); };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; previous = 0; };
    scheduling.current = { resume, stop };
    const resize = () => {
      sizeDirty = true;
      if (!visible || document.hidden || lost) return;
      const rect = host.getBoundingClientRect();
      const ratio = Math.min(devicePixelRatio || 1, coarse ? 1 : 1.5);
      const width = Math.max(1, Math.round(rect.width * ratio));
      const height = Math.max(1, Math.round(rect.height * ratio));
      if (surface.width === width && surface.height === height) { sizeDirty = false; return; }
      surface.width = width; surface.height = height;
      sizeDirty = false;
      context.viewport(0, 0, surface.width, surface.height); draw();
    };
    const pointer = (event: PointerEvent) => {
      if (!animation.current || event.pointerType === 'touch' || document.querySelector('dialog[open]')) return;
      targetX = (event.clientX / innerWidth - .5) * 2;
      targetY = (event.clientY / innerHeight - .5) * 2;
    };
    const leave = () => { targetX = 0; targetY = 0; };
    const onLost = (event: Event) => {
      event.preventDefault(); lost = true; cancelAnimationFrame(frame); frame = 0; setRenderer('fallback');
    };
    const observation = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      host.dataset.visible = String(visible);
      if (!visible) stop();
      else { if (sizeDirty) resize(); resume(); }
    }, { rootMargin: '80px' });
    const onVisibility = () => {
      if (document.hidden) stop();
      else { if (sizeDirty) resize(); resume(); }
    };
    const resizeObserver = new ResizeObserver(resize);
    observation.observe(host); resizeObserver.observe(host);
    const hero = host.closest('.onda-hero');
    const experience = host.closest('.public-platform');
    const onJourney = (event: Event) => { targetJourney = Math.max(0, Math.min(1, Number((event as CustomEvent<number>).detail) || 0)); };
    experience?.addEventListener('onda-journey', onJourney);
    hero?.addEventListener('pointermove', pointer as EventListener, { passive: true });
    hero?.addEventListener('pointerleave', leave);
    surface.addEventListener('webglcontextlost', onLost);
    document.addEventListener('visibilitychange', onVisibility);
    setRenderer('webgl');
    return () => {
      stop(); scheduling.current = null; observation.disconnect(); resizeObserver.disconnect();
      hero?.removeEventListener('pointermove', pointer as EventListener);
      hero?.removeEventListener('pointerleave', leave);
      experience?.removeEventListener('onda-journey', onJourney);
      surface.removeEventListener('webglcontextlost', onLost);
      document.removeEventListener('visibilitychange', onVisibility);
      context.deleteBuffer(buffer); context.deleteProgram(program);
      context.deleteShader(vertex); context.deleteShader(fragment);
    };
  }, []);

  return <div ref={container} className="onda-orb" data-renderer={renderer} data-animated={String(animated)} aria-hidden="true">
    <div className="onda-image-aperture"><img src={`${import.meta.env.BASE_URL}onda-orbit.jpg`} alt="" width="1200" height="1200" fetchPriority="high" /></div>
    <canvas ref={canvas} className="onda-orb-canvas" />
  </div>;
}
