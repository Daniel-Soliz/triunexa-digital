import { useEffect, useRef, useState, type RefObject } from 'react';
import { CORE_CONFIG, SCENES, chapterForProgress, clamp, frameForProgress, progressForScroll, smooth, type ChapterBounds } from './config';
import { drawCore, type Anchor } from './renderer';
import { DEFAULT_MANIFEST, FrameCache, parseManifest, drawImageFrame } from './frames';
type SmoothScroll={raf:(time:number)=>void;destroy:()=>void;stop:()=>void;start:()=>void;scrollTo:(target:Element,options?:object)=>void};
type LenisConstructor=new(options:object)=>SmoothScroll;
let lenisPromise:Promise<LenisConstructor>|undefined;
function loadLenis(){
 const existing=(window as Window&{Lenis?:LenisConstructor}).Lenis;
 if(existing)return Promise.resolve(existing);
 if(lenisPromise)return lenisPromise;
 lenisPromise=new Promise((resolve,reject)=>{
  const run=()=>{
   const script=document.createElement('script');script.src=CORE_CONFIG.lenisUrl;script.async=true;
   const timeout=setTimeout(()=>{script.remove();reject(new Error('Smooth-scroll unavailable'));},5000);
   script.onload=()=>{clearTimeout(timeout);const Constructor=(window as Window&{Lenis?:LenisConstructor}).Lenis;Constructor?resolve(Constructor):reject(new Error('Smooth-scroll unavailable'));};
   script.onerror=()=>{clearTimeout(timeout);reject(new Error('Smooth-scroll unavailable'));};
   document.head.append(script);
  };
  if(document.readyState==='complete')run();else window.addEventListener('load',run,{once:true});
 });
 return lenisPromise;
}
export default function CoreCanvas({rootRef}:{rootRef:RefObject<HTMLDivElement|null>}){
 const canvasRef=useRef<HTMLCanvasElement>(null),[ready,setReady]=useState(false);
 useEffect(()=>{
  const root=rootRef.current,canvas=canvasRef.current;
  if(!root||!canvas)return;
  const ctx=canvas.getContext('2d',{alpha:true});
  if(!ctx){setReady(true);root.dataset.coreRenderer='gradient';return;}
  let alive=true,raf=0,width=innerWidth,height=innerHeight,dirty=true,lastFrame=-1,lastProgress=-1;
  let bounds:ChapterBounds[]=[],anchors:Anchor[]=[],lenis:SmoothScroll|undefined,cache:FrameCache|undefined;
  let manifest=DEFAULT_MANIFEST;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)'),pointerFine=matchMedia('(pointer:fine)');
  const mouse={x:0,y:0},events:(()=>void)[]=[];
  const abort=new AbortController();
  const on=(target:EventTarget,event:string,handler:EventListener,options?:AddEventListenerOptions)=>{
   target.addEventListener(event,handler,options);events.push(()=>target.removeEventListener(event,handler,options));
  };
  root.dataset.cinema='enabled';root.dataset.motion=reduce.matches?'reduced':'full';root.dataset.coreRenderer='procedural';
  const panels=Array.from(root.querySelectorAll<HTMLElement>('[data-core-copy]'));
  const progressBar=root.querySelector<HTMLElement>('.scroll-progress');
  const cursor=root.querySelector<HTMLElement>('.cinema-cursor');
  const queue=()=>{if(alive&&!document.hidden&&!raf)raf=requestAnimationFrame(tick);};
  function measure(){
   bounds=SCENES.map(name=>{
    const element=root!.querySelector<HTMLElement>('[data-core-scene="'+name+'"]');
    return element?{top:element.getBoundingClientRect().top+scrollY,height:element.offsetHeight}:{top:0,height:innerHeight};
   });
   dirty=true;queue();
  }
  function size(){
   width=innerWidth;height=innerHeight;
   const ratio=Math.min(devicePixelRatio||1,width<=700?CORE_CONFIG.mobileDpr:CORE_CONFIG.dpr);
   canvas!.width=Math.round(width*ratio);canvas!.height=Math.round(height*ratio);
   canvas!.style.width=width+'px';canvas!.style.height=height+'px';
   ctx!.setTransform(ratio,0,0,ratio,0,0);dirty=true;measure();
  }
  function updateText(progress:number){
   const chapter=chapterForProgress(progress);
   root!.dataset.coreChapter=chapter.name;
   root!.dataset.activeScene=chapter.index>=2?'catalog':'hero';
   panels.forEach(panel=>{
    const i=SCENES.indexOf(panel.dataset.coreCopy as typeof SCENES[number]);
    if(reduce.matches){panel.style.opacity='1';panel.style.transform='none';panel.style.setProperty('--line-reveal','1');return;}
    const local=clamp(progress*SCENES.length-i);
    const scene=panel.closest<HTMLElement>('[data-core-scene]');
    const top=scene?.getBoundingClientRect().top??0;
    const entrance=i===0?1:smooth((height*.95-top)/(height*.25));
    const exit=i===0?1-smooth((local-.90)/.10):1;
    panel.style.opacity=String(entrance*exit);
    panel.style.transform='translate3d(0,'+((1-entrance)*24)+'px,0)';
    panel.style.setProperty('--line-reveal',String(entrance));
   });
   root!.querySelectorAll<HTMLElement>('[data-core-count]').forEach(el=>{
    const goal=Number(el.dataset.coreCount)||0;
    const statsTop=el.closest<HTMLElement>('[data-core-scene]')?.getBoundingClientRect().top??0;
    const amount=reduce.matches?1:smooth((height*.9-statsTop)/(height*.45));
    const value=Math.round(goal*amount).toLocaleString('pt-BR');
    if(el.textContent!==value)el.textContent=value;
   });
   if(progressBar)progressBar.style.transform='scaleX('+clamp(scrollY/Math.max(1,document.documentElement.scrollHeight-height))+')';
   root!.style.setProperty('--scene-progress',String(progress));
  }
  function tick(time:number){
   raf=0;if(!alive||document.hidden)return;
   lenis?.raf(time);
   const progress=progressForScroll(scrollY,bounds,height);
   const visualProgress=reduce.matches ? 0.14 :clamp(progress*CORE_CONFIG.motionScale);
   const index=frameForProgress(visualProgress,manifest.enabled?manifest.count:CORE_CONFIG.frameCount);
   if(progress!==lastProgress){updateText(progress);lastProgress=progress;}
   if(index!==lastFrame||dirty){
    const frame=manifest.enabled?cache?.get(index):undefined;
    if(manifest.enabled)cache?.request(index);
    if(frame){drawImageFrame(ctx!,frame,width,height,manifest.fit);root!.dataset.coreRenderer='frames';}
    else{
     if(chapterForProgress(visualProgress).index===2){
      anchors=Array.from(root!.querySelectorAll<HTMLElement>('.lead-card')).slice(0,12).map(el=>{const rect=el.getBoundingClientRect();return{x:rect.right-28,y:rect.top+30};});
     }else anchors=[];
     drawCore(ctx!,width,height,index/Math.max(1,(manifest.enabled?manifest.count:CORE_CONFIG.frameCount)-1),reduce.matches?{x:0,y:0}:mouse,width<=700,anchors);
     root!.dataset.coreRenderer='procedural';
    }
    lastFrame=index;root!.dataset.coreFrame=String(index);dirty=false;
   }
   if(lenis&&!reduce.matches)queue();
  }
  const resetMotion=()=>{
   root.dataset.motion=reduce.matches?'reduced':'full';lenis?.destroy();lenis=undefined;
   if(!reduce.matches)void loadLenis().then(Constructor=>{
    if(!alive||reduce.matches)return;
    lenis=new Constructor({duration:CORE_CONFIG.smoothDuration,smoothWheel:true,syncTouch:false,anchors:false,
     prevent:(node:HTMLElement)=>Boolean(node.closest('dialog,[data-lenis-prevent]'))});queue();
   }).catch(()=>{});
   dirty=true;lastProgress=-1;queue();
  };
  on(window,'scroll',()=>queue(),{passive:true});
  on(window,'resize',()=>size());
  on(reduce,'change',()=>resetMotion());
  on(document,'visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else{dirty=true;queue();}});
  on(root,'pointermove',((event:PointerEvent)=>{
   if(reduce.matches||event.pointerType==='touch'||!pointerFine.matches)return;
   mouse.x=event.clientX/width-.5;mouse.y=event.clientY/height-.5;dirty=true;
   if(cursor)cursor.style.transform='translate3d('+event.clientX+'px,'+event.clientY+'px,0)';
   const card=(event.target as Element).closest<HTMLElement>('.lead-card');
   if(card){const r=card.getBoundingClientRect(),x=(event.clientX-r.left)/r.width,y=(event.clientY-r.top)/r.height;
    card.style.setProperty('--tilt-x',((.5-y)*5)+'deg');card.style.setProperty('--tilt-y',((x-.5)*5)+'deg');
    card.style.setProperty('--shine-x',(x*100)+'%');card.style.setProperty('--shine-y',(y*100)+'%');}
   queue();
  }) as EventListener,{passive:true});
  on(root,'pointerout',((event:PointerEvent)=>{const card=(event.target as Element).closest<HTMLElement>('.lead-card');if(card&&!card.contains(event.relatedTarget as Node)){card.style.setProperty('--tilt-x','0deg');card.style.setProperty('--tilt-y','0deg');}}) as EventListener);
  on(root,'click',((event:MouseEvent)=>{
   const link=(event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
   const hash=link?.getAttribute('href');
   const safe=['#inicio','#conexoes','#empresas','#oportunidades','#final','#criador'];
   if(link&&hash&&safe.includes(hash)&&lenis){const destination=root.querySelector(hash);if(destination){event.preventDefault();history.replaceState(null,'',hash);lenis.scrollTo(destination,{offset:-90});}}
   if(root.querySelector('dialog[open]'))lenis?.stop();else lenis?.start();
  }) as EventListener);
  on(root,'close',()=>lenis?.start(),{capture:true});on(root,'cancel',()=>lenis?.start(),{capture:true});
  const observer=new ResizeObserver(()=>measure());observer.observe(root);
  const mutation=new MutationObserver(()=>measure());
  const grid=root.querySelector('.leads-grid');if(grid)mutation.observe(grid,{childList:true});
  void fetch(import.meta.env.BASE_URL+CORE_CONFIG.manifest,{signal:abort.signal,cache:'no-cache'})
   .then(r=>r.ok?r.json():null).then(value=>{
    if(!alive)return;manifest=parseManifest(value);
    if(manifest.enabled)cache=new FrameCache(manifest,import.meta.env.BASE_URL+'core-frames/',()=>{dirty=true;queue();},width<=700?8:12);
    dirty=true;queue();
   }).catch(()=>{});
  size();resetMotion();
  const loading=setTimeout(()=>{if(alive)setReady(true);},700);
  return ()=>{
   alive=false;clearTimeout(loading);cancelAnimationFrame(raf);abort.abort();cache?.dispose();lenis?.destroy();
   observer.disconnect();mutation.disconnect();events.forEach(off=>off());
   panels.forEach(panel=>{panel.style.removeProperty('opacity');panel.style.removeProperty('transform');panel.style.removeProperty('--line-reveal');});
   ['cinema','motion','coreRenderer','coreFrame','coreChapter','activeScene'].forEach(key=>delete root.dataset[key]);
  };
 },[rootRef]);
 return <>
  <canvas ref={canvasRef} className="core-canvas" aria-hidden="true"/>
  <div className="core-vignette" aria-hidden="true"/>
  <span className="cinema-cursor" aria-hidden="true"/>
  {!ready&&<div className="core-loader" aria-hidden="true"><span>TRIUNEXA</span><small>Uma rede. Infinitas conexões.</small></div>}
 </>;
}
