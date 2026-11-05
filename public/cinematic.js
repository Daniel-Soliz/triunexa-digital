/* Progressive enhancement: content and navigation never depend on CDN/WebGL. */
export const CINEMA = {
 nodes: 84, mobileNodes: 30, cameraSpeed: 1, pixelRatio: 2,
 green: 0x88a887, accent: 0xd9cc9d, fog: 0x101e18,
 gsap: 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js',
 trigger: 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js',
 lenis: 'https://cdn.jsdelivr.net/npm/lenis@1.3.11/dist/lenis.min.js',
 three: 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js'
};
const scripts = new Map();
function script(url) {
 if (scripts.has(url)) return scripts.get(url);
 const task = new Promise((resolve,reject)=>{
  const el=document.createElement('script'); el.src=url; el.async=true;
  const timeout=setTimeout(()=>{el.remove();reject(new Error('Animation CDN timed out'));},5000);
  el.onload=()=>{clearTimeout(timeout);resolve();};
  el.onerror=()=>{clearTimeout(timeout);reject(new Error('Animation CDN unavailable'));};
  document.head.append(el);
 });
 scripts.set(url,task);return task;
}
export async function initCinema(root) {
 let disposed=false, cleanups=[], renderer, scene, camera, lenis, master, pin, resizeObserver, observer, raf=0, context;
 let gsap, ScrollTrigger, THREE, nodes, lines, positions, dummy, points=[], cardRects=[], gridCards=[];
 let state={journey:0}, target={x:0,y:0}, cursor={x:innerWidth/2,y:innerHeight/2}, count=0, startTime=performance.now();
 const mobile=matchMedia('(max-width: 700px)').matches;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const canvas=root.querySelector('.network-canvas'), loader=root.querySelector('.cinema-loading');
 let motionReduced=reduced.matches;
 const ready=()=>{root.dataset.cinemaReady='true';if(loader)loader.setAttribute('hidden','');};
 const timeout=setTimeout(ready,1800);
 const on=(el,event,handler,opts)=>{el.addEventListener(event,handler,opts);cleanups.push(()=>el.removeEventListener(event,handler,opts));};
 function cleanup() {
  disposed=true; clearTimeout(timeout);cancelAnimationFrame(raf);
  cleanups.forEach(f=>f());observer?.disconnect();resizeObserver?.disconnect();
  master?.kill();pin?.kill();context?.revert();lenis?.destroy();
  if(renderer){scene?.traverse(o=>{o.geometry?.dispose();const m=o.material;if(Array.isArray(m))m.forEach(x=>x.dispose());else m?.dispose();});renderer.dispose();}
  root.removeAttribute('data-cinema');root.removeAttribute('data-motion');
 }
 // Return immediately so StrictMode and route changes can cancel pending imports.
 const start=async()=>{
  try{
   await script(CINEMA.gsap);if(disposed)return;gsap=window.gsap;
   await Promise.all([script(CINEMA.trigger),script(CINEMA.lenis)]);if(disposed)return;
   ScrollTrigger=window.ScrollTrigger;gsap.registerPlugin(ScrollTrigger);
  }catch{ready();return;}
  root.dataset.cinema='enabled';root.dataset.motion=motionReduced?'reduced':'full';
  const hero=root.querySelector('.hero');
  if(!motionReduced && !mobile){
   pin=ScrollTrigger.create({trigger:hero,start:'top top',end:()=>'+='+Math.round(innerHeight*.65),pin:true,pinSpacing:true,anticipatePin:1,invalidateOnRefresh:true});
  }
  if(!motionReduced&&window.Lenis){
   lenis=new window.Lenis({duration:1.12,smoothWheel:true,syncTouch:false,anchors:false,
    prevent:node=>Boolean(node.closest('dialog,[data-lenis-prevent]'))});
   lenis.on('scroll',ScrollTrigger.update);
  }
  const progress=root.querySelector('.scroll-progress');
  function rects(){
   gridCards=[...root.querySelectorAll('.lead-card')].slice(0,12);
   cardRects=gridCards.map(el=>{const r=el.getBoundingClientRect();return{x:r.right-32,y:r.top+32+scrollY};});
  }
  function build(){
   if(disposed)return;
   master?.kill();context?.revert();
   context=gsap.context(()=>{
    const total=Math.max(1,root.scrollHeight-innerHeight);
    const catalog=root.querySelector('#empresas');
    const catalogTop=catalog.getBoundingClientRect().top+scrollY;
    const heroEnd=Math.max(.08,Math.min(.5,(catalogTop-innerHeight*.4)/total));
    master=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:root,start:'top top',end:'bottom bottom',scrub:motionReduced?false:.65,invalidateOnRefresh:true,onUpdate:self=>{
     if(progress)progress.style.transform='scaleX('+self.progress+')';
     const active=self.scroll()>catalogTop-innerHeight*.4;
     root.dataset.activeScene=active?'catalog':'hero';
    }}});
    master.to(state,{journey:1,duration:1},0);
    if(!motionReduced){
     master.to('.hero-copy h1',{scale:.84,yPercent:-27,opacity:.15,duration:heroEnd,ease:'power3.inOut'},0);
     master.to('.hero-copy > p,.hero-actions,.hero-proof',{y:-60,opacity:.12,duration:heroEnd},0);
     master.to('.orbit-one',{rotation:90,scale:1.45,y:-100,duration:heroEnd},0);
     master.to('.orbit-two',{rotation:-55,scale:1.7,y:-45,duration:heroEnd},0);
     master.to('.art-center',{rotationY:35,rotationZ:12,y:-70,scale:.7,duration:heroEnd},0);
     master.to('.floating-card',{y:(i)=>-40-i*35,rotationZ:(i)=>i?9:-10,duration:heroEnd},0);
     root.querySelectorAll('.lead-card,.story-line,.creator-copy h2').forEach((el,i)=>{
      const top=el.getBoundingClientRect().top+scrollY;
      const at=Math.max(0,Math.min(.97,(top-innerHeight*.93)/total));
      const duration=Math.min(.065,1-at);
      // Only animate transforms; all content stays readable if animation stalls.
      master.fromTo(el,{y:38,rotateX:4},{y:0,rotateX:0,duration,ease:'power3.out',immediateRender:false},at+(el.matches('.lead-card')?(i%3)*.003:0));
     });
    }
   },root);
   root.querySelectorAll('[data-count]').forEach(el=>{
    const value=Number(el.dataset.count||0),counter={value:motionReduced?value:0};
    if(!motionReduced)master.to(counter,{value,duration:.15,ease:'power3.out',onUpdate:()=>{el.textContent=Math.round(counter.value).toLocaleString('pt-BR');}},.05);
   });
   rects();ScrollTrigger.refresh();
  }
  build();
  let pending;
  observer=new MutationObserver(()=>{clearTimeout(pending);pending=setTimeout(build,100);});
  const grid=root.querySelector('.catalog');if(grid)observer.observe(grid,{childList:true,subtree:true});
  cleanups.push(()=>clearTimeout(pending));
  on(window,'resize',()=>{rects();ScrollTrigger.refresh();});
  on(document,'visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else if(!raf){raf=requestAnimationFrame(render);}});
  on(reduced,'change',()=>{cleanup();ready();});
  on(root,'pointermove',ev=>{
   if(motionReduced||ev.pointerType==='touch')return;
   target.x=ev.clientX/innerWidth-.5;target.y=ev.clientY/innerHeight-.5;
   cursor.x=ev.clientX;cursor.y=ev.clientY;
   const card=ev.target.closest('.lead-card');
   if(card && !mobile){const r=card.getBoundingClientRect(),x=(ev.clientX-r.left)/r.width,y=(ev.clientY-r.top)/r.height;
    card.style.setProperty('--tilt-x',((.5-y)*5)+'deg');card.style.setProperty('--tilt-y',((x-.5)*5)+'deg');
    card.style.setProperty('--shine-x',(x*100)+'%');card.style.setProperty('--shine-y',(y*100)+'%');}
  },{passive:true});
  on(root,'pointerout',ev=>{const card=ev.target.closest('.lead-card');if(card&&!card.contains(ev.relatedTarget)){card.style.setProperty('--tilt-x','0deg');card.style.setProperty('--tilt-y','0deg');}});
  on(root,'click',event=>{
   const link=event.target.closest('a[href="#empresas"],a[href="#criador"]');
   if(link&&lenis){const hash=link.getAttribute('href'),destination=root.querySelector(hash);if(destination){event.preventDefault();history.replaceState(null,'',hash);lenis.scrollTo(destination,{offset:-100});}}
   const open=Boolean(root.querySelector('dialog[open]'));if(open)lenis?.stop();else lenis?.start();});
  on(root,'close',()=>lenis?.start(),true);
  on(root,'cancel',()=>lenis?.start(),true);
  let drawnOnce=false;
  function render(time){
   if(disposed||document.hidden){raf=0;return;}
   lenis?.raf(time);
   const dot=root.querySelector('.cinema-cursor');
   if(dot&&!mobile&&!motionReduced)dot.style.transform='translate3d('+cursor.x+'px,'+cursor.y+'px,0)';
   if(renderer&&(!motionReduced||!drawnOnce)){
    const p=motionReduced ? 0.18 :Math.min(1,state.journey*CINEMA.cameraSpeed);
    const catalog=root.querySelector('#empresas'),cr=catalog?.getBoundingClientRect();
    const morph=cr?Math.max(0,Math.min(1,(innerHeight-cr.top)/(innerHeight*.8))):0;
    const drift=motionReduced?0:Math.sin((time-startTime)*.00015)*.08;
    camera.position.set(Math.sin(p*Math.PI*.8)*3+target.x*.18,1+p*3-target.y*.14,11-p*4);
    camera.lookAt(0,1+p*1.4,0);camera.updateMatrixWorld();
    for(let i=0;i<count;i++){
     const a=points[i],phase=Math.min(1,morph),gridX=((i%6)-2.5)*1.6,gridY=(2-Math.floor(i/6)%5)*1.35;
     let v=new THREE.Vector3(a.x*(1-phase)+gridX*phase,a.y*(1-phase)+gridY*phase,a.z*(1-phase)-phase*2);
     if(phase>.7&&i<cardRects.length){
      const r=cardRects[i],y=r.y-scrollY;
      if(y>-80&&y<innerHeight+80){
       const ndc=new THREE.Vector3(r.x/innerWidth*2-1,-(y/innerHeight)*2+1,.5).unproject(camera);
       const dir=ndc.sub(camera.position).normalize();
       const align=camera.position.clone().add(dir.multiplyScalar(9));
       v.lerp(align,(phase-.7)/.3);
      }
     }
     dummy.position.set(v.x,v.y+drift,v.z);dummy.scale.setScalar(i%5===0?.09:.05);dummy.updateMatrix();nodes.setMatrixAt(i,dummy.matrix);
     positions[i*6]=v.x;positions[i*6+1]=v.y+drift;positions[i*6+2]=v.z;
     const next=points[(i+1)%count],j=(i+1)%count;
     positions[i*6+3]=next.x*(1-phase)+((j%6)-2.5)*1.6*phase;
     positions[i*6+4]=next.y*(1-phase)+(2-Math.floor(j/6)%5)*1.35*phase+drift;
     positions[i*6+5]=next.z*(1-phase)-phase*2;
    }
    nodes.instanceMatrix.needsUpdate=true;lines.geometry.attributes.position.needsUpdate=true;
    renderer.render(scene,camera);drawnOnce=true;
   }
   raf=motionReduced ? 0 : requestAnimationFrame(render);
  }
  raf=requestAnimationFrame(render);
  try{
   THREE=await import(CINEMA.three);if(disposed)return;
   renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:!mobile,powerPreference:'low-power'});
   renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.3:CINEMA.pixelRatio));renderer.setSize(innerWidth,innerHeight);
   scene=new THREE.Scene();scene.fog=new THREE.FogExp2(CINEMA.fog,.045);
   camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.1,80);
   camera.position.set(0,1,11);scene.add(new THREE.AmbientLight(0xcbd5bd,1.4));
   const light=new THREE.PointLight(CINEMA.accent,35,40);light.position.set(3,5,5);scene.add(light);
   count=mobile?CINEMA.mobileNodes:CINEMA.nodes;
   const material=new THREE.MeshStandardMaterial({color:CINEMA.green,metalness:.6,roughness:.3,emissive:CINEMA.green,emissiveIntensity:.35});
   nodes=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),material,count);nodes.frustumCulled=false;scene.add(nodes);
   dummy=new THREE.Object3D();
   for(let i=0;i<count;i++){const theta=i*2.399963;points.push({x:Math.cos(theta)*(2+(i%8)*.5),y:Math.sin(theta)*(2+(i%7)*.55)+1,z:Math.sin(i*.8)*4});}
   positions=new Float32Array(count*6);
   const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
   lines=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:CINEMA.green,transparent:true,opacity:.18}));lines.frustumCulled=false;scene.add(lines);
   on(window,'resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);drawnOnce=false;if(!raf)raf=requestAnimationFrame(render);});
   on(canvas,'webglcontextlost',ev=>{ev.preventDefault();renderer?.dispose();renderer=null;root.dataset.webgl='fallback';});
   root.dataset.webgl='ready';if(!raf)raf=requestAnimationFrame(render);
  }catch{root.dataset.webgl='fallback';}
  finally{ready();}
 };
 const begin=()=>void start().catch(()=>{cleanup();ready();});
 if(document.readyState==='complete')begin();
 else on(window,'load',begin,{once:true});
 return cleanup;
}
