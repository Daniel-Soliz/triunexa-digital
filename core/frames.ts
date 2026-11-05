import { clamp } from './config';
export interface FrameManifest {enabled:boolean;count:number;pattern:string;padding:number;start:number;fit:'contain'|'cover'}
export const DEFAULT_MANIFEST:FrameManifest={enabled:false,count:180,pattern:'frame_{index}.webp',padding:4,start:1,fit:'cover'};
export function parseManifest(value:unknown):FrameManifest {
 if(!value||typeof value!=='object')return DEFAULT_MANIFEST;
 const v=value as Partial<FrameManifest>;
 if(v.enabled!==true||!Number.isInteger(v.count)||v.count!<2||v.count!>600||typeof v.pattern!=='string'||!/^[-a-zA-Z0-9_{}]+\.webp$/.test(v.pattern)||!v.pattern.includes('{index}'))return DEFAULT_MANIFEST;
 return {enabled:true,count:v.count!,pattern:v.pattern,padding:Math.round(clamp(Number(v.padding)||4,1,6)),start:Math.round(clamp(Number(v.start)||1,0,1)),fit:v.fit==='contain'?'contain':'cover'};
}
export class FrameCache {
 private images=new Map<number,HTMLImageElement>();
 private pending=new Set<number>();
 private failed=new Set<number>();
 private alive=true;
 constructor(private manifest:FrameManifest,private base:string,private changed:()=>void,private limit=12){}
 get(index:number){
  const image=this.images.get(index);
  if(image){this.images.delete(index);this.images.set(index,image);}
  return image;
 }
 request(index:number){
  for(const offset of [0,1,-1,2,-2]){
   const i=Math.round(clamp(index+offset,0,this.manifest.count-1));
   if(this.images.has(i)||this.pending.has(i)||this.failed.has(i)||this.pending.size>=3)continue;
   const image=new Image();image.decoding='async';image.loading='eager';this.pending.add(i);
   image.onload=()=>{
    if(!this.alive)return;
    this.pending.delete(i);this.images.set(i,image);
    while(this.images.size>this.limit)this.images.delete(this.images.keys().next().value!);
    this.changed();
   };
   image.onerror=()=>{if(!this.alive)return;this.pending.delete(i);this.failed.add(i);this.changed();};
   image.src=this.base+this.manifest.pattern.replace('{index}',String(i+this.manifest.start).padStart(this.manifest.padding,'0'));
  }
 }
 dispose(){this.alive=false;this.images.clear();this.pending.clear();this.failed.clear();}
}
export function drawImageFrame(ctx:CanvasRenderingContext2D,img:HTMLImageElement,w:number,h:number,fit:FrameManifest['fit']){
 const scale=fit==='contain'?Math.min(w/img.naturalWidth,h/img.naturalHeight):Math.max(w/img.naturalWidth,h/img.naturalHeight);
 const width=img.naturalWidth*scale,height=img.naturalHeight*scale;
 ctx.clearRect(0,0,w,h);ctx.drawImage(img,(w-width)/2,(h-height)/2,width,height);
}
