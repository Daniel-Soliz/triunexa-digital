export const CORE_CONFIG = {
 frameCount:720,
 dpr:2,
 mobileDpr:1.35,
 nodes:72,
 mobileNodes:36,
 motionScale:1,
 smoothDuration:1.15,
 lenisUrl:'https://cdn.jsdelivr.net/npm/lenis@1.3.11/dist/lenis.min.js',
 manifest:'core-frames/manifest.json',
 colors:{emerald:'#51dc9a',deep:'#284d35',gold:'#d4c491',light:'#d6ffe9'},
};
export type SceneName='hero'|'connections'|'companies'|'opportunities'|'final';
export const SCENES:SceneName[]=['hero','connections','companies','opportunities','final'];
export const clamp=(v:number,min=0,max=1)=>Math.min(max,Math.max(min,v));
export const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
export const smooth=(t:number)=>{t=clamp(t);return t*t*(3-2*t);};
export function frameForProgress(progress:number,count=CORE_CONFIG.frameCount){
 return Math.min(count-1,Math.floor(clamp(progress)*count));
}
export function chapterForProgress(progress:number){
 const value=clamp(progress)*SCENES.length,index=Math.min(SCENES.length-1,Math.floor(value));
 return {index,name:SCENES[index],local:clamp(value-index)};
}
export interface ChapterBounds {top:number;height:number}
export function progressForScroll(y:number,bounds:ChapterBounds[],viewport:number){
 if(!bounds.length)return 0;
 let index=0;for(let i=0;i<bounds.length;i++){if(y>=bounds[i].top)index=i;}
 const current=bounds[index],end=bounds[index+1]?.top ?? current.top+Math.max(1,current.height-viewport);
 return clamp((index+clamp((y-current.top)/Math.max(1,end-current.top)))/bounds.length);
}
