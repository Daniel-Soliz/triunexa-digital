import { useEffect, useRef } from 'react';
type CinemaAPI = {initCinema:(root:HTMLDivElement)=>Promise<()=>void>};
declare global { interface Window { TriunexaCinema?: CinemaAPI } }
let modulePromise:Promise<CinemaAPI>|undefined;
function cinemaScript():Promise<CinemaAPI> {
 if(window.TriunexaCinema)return Promise.resolve(window.TriunexaCinema);
 if(modulePromise)return modulePromise;
 modulePromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src=import.meta.env.BASE_URL+'cinematic.js';script.async=true;
  script.onload=()=>window.TriunexaCinema?resolve(window.TriunexaCinema):reject(new Error('Animation module unavailable'));
  script.onerror=()=>reject(new Error('Animation module unavailable'));
  document.head.appendChild(script);
 });
 return modulePromise;
}
export function useCinema(active:boolean) {
 const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(!active || !ref.current)return;
  const root=ref.current;let cancelled=false,cleanup:undefined|(()=>void);
  const loading=root.querySelector<HTMLElement>('.cinema-loading');
  const timeout=setTimeout(()=>{if(loading)loading.hidden=true;},2000);
  cinemaScript().then(async mod=>{
   if(cancelled)return;
   const stop=await mod.initCinema(root);
   if(cancelled)stop?.();else cleanup=stop;
  }).catch(()=>{if(loading)loading.hidden=true;});
  return ()=>{cancelled=true;clearTimeout(timeout);cleanup?.();};
 },[active]);
 return ref;
}
