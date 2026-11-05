import { CORE_CONFIG, chapterForProgress, clamp, mix, smooth } from './config';
type V={x:number;y:number;z:number};
export type Anchor={x:number;y:number};
export interface Pose {scale:number;explode:number;rotation:number;grid:number;travel:number}
export function corePose(progress:number):Pose {
 const {index,local:t}=chapterForProgress(progress),s=smooth(t);
 switch(index){
  case 0:return {scale:mix(.27,1.2,s),explode:0,rotation:mix(-.6,.8,s),grid:0,travel:0};
  case 1:return {scale:mix(1.2,.98,s),explode:s,rotation:mix(.8,1.8,s),grid:0,travel:0};
  case 2:return {scale:.98,explode:1,rotation:mix(1.8,2.8,s),grid:smooth(t/.2)*(1-smooth((t-.84)/.16)),travel:0};
  case 3:return {scale:mix(.98,2.8,s),explode:mix(1,.7,s),rotation:mix(2.8,3.7,s),grid:0,travel:mix(0,2.5,s)};
  default:return {scale:mix(2.8,1.02,s),explode:mix(.7,0,s),rotation:mix(3.7,Math.PI*2,s),grid:0,travel:mix(2.5,0,s)};
 }
}
const golden=(1+Math.sqrt(5))/2;
const vertices:V[]=[[-1,golden,0],[1,golden,0],[-1,-golden,0],[1,-golden,0],[0,-1,golden],[0,1,golden],[0,-1,-golden],[0,1,-golden],[golden,0,-1],[golden,0,1],[-golden,0,-1],[-golden,0,1]].map(([x,y,z])=>{const length=Math.hypot(x,y,z);return{x:x/length,y:y/length,z:z/length};});
const faces=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
const clouds=new Map<number,V[]>();
function cloud(count:number){
 if(clouds.has(count))return clouds.get(count)!;
 const points=Array.from({length:count},(_,i)=>{const y=1-2*(i+.5)/count,r=Math.sqrt(1-y*y),a=i*2.399963;return{x:Math.cos(a)*r,y,z:Math.sin(a)*r};});
 clouds.set(count,points);return points;
}
function rotate(v:V,angle:number,tilt:number):V {
 const x=v.x*Math.cos(angle)+v.z*Math.sin(angle),z=-v.x*Math.sin(angle)+v.z*Math.cos(angle);
 return {x,y:v.y*Math.cos(tilt)-z*Math.sin(tilt),z:v.y*Math.sin(tilt)+z*Math.cos(tilt)};
}
export function drawCore(ctx:CanvasRenderingContext2D,w:number,h:number,progress:number,mouse:Anchor,mobile:boolean,anchors:Anchor[]=[]){
 const pose=corePose(progress),radius=Math.min(w*.38,h*.38)*pose.scale;
 const cx=w*(mobile ? 0.5 : 0.56)+mouse.x*12,cy=h*(mobile ? 0.39 : 0.46)+mouse.y*10;
 const tilt=.12+Math.sin(progress*Math.PI*3)*.3;
 const project=(v:V)=>{const d=4/Math.max(.65,4-v.z-pose.travel);return{x:cx+v.x*radius*d,y:cy+v.y*radius*d,z:v.z};};
 ctx.clearRect(0,0,w,h);
 // Original emerald network: no imported character, image, logo or film assets.
 const halo=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(1,radius*1.7));
 halo.addColorStop(0,'rgba(67,237,150,.13)');halo.addColorStop(.5,'rgba(31,148,89,.045)');halo.addColorStop(1,'rgba(20,54,36,0)');
 ctx.fillStyle=halo;ctx.fillRect(0,0,w,h);
 const shards=faces.map((face,index)=>{
  const center=face.reduce((a,id)=>({x:a.x+vertices[id].x/3,y:a.y+vertices[id].y/3,z:a.z+vertices[id].z/3}),{x:0,y:0,z:0});
  const orbit=pose.explode*(1.1+(index%4)*.12),a=pose.rotation+pose.explode*(index%2?.45:-.45);
  const points=face.map(id=>{
   const v=vertices[id],shrink=1-pose.explode*.2;
   return project(rotate({x:center.x+(v.x-center.x)*shrink+center.x*orbit,y:center.y+(v.y-center.y)*shrink+center.y*orbit,z:center.z+(v.z-center.z)*shrink+center.z*orbit},a,tilt));
  });
  return {points,z:points.reduce((n,v)=>n+v.z,0)/3,index};
 }).sort((a,b)=>a.z-b.z);
 for(const shard of shards){
  const [a,b,c]=shard.points;
  ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.closePath();
  const light=clamp((shard.z+1.5)/3),opacity=(.035+light*.12)*(1-pose.grid*.45);
  ctx.fillStyle='rgba(40,153,99,'+opacity+')';ctx.fill();
  ctx.strokeStyle=shard.index%6===0?'rgba(212,196,145,.48)':'rgba(103,229,164,'+(.16+light*.3)+')';
  ctx.lineWidth=mobile ? 0.65 : 0.9;ctx.stroke();
 }
 const count=mobile?CORE_CONFIG.mobileNodes:CORE_CONFIG.nodes;
 const points=cloud(count).map((v,i)=>{
  const orbit=1+pose.explode*(.85+(i%5)*.12),float=Math.sin(progress*13+i*.8)*pose.explode*.12;
  const projected=project(rotate({x:v.x*orbit,y:v.y*orbit+float,z:v.z*orbit},pose.rotation,tilt));
  let gx=w*(.18+(i%6)*.128),gy=h*(.12+(Math.floor(i/6)%6)*.145);
  if(i<anchors.length){gx=anchors[i].x;gy=anchors[i].y;}
  return{x:mix(projected.x,gx,pose.grid),y:mix(projected.y,gy,pose.grid),z:projected.z};
 });
 ctx.lineWidth=.65;
 for(let i=0;i<count;i++){
  for(const step of [1,7]){
   const a=points[i],b=points[(i+step)%count],length=Math.hypot(a.x-b.x,a.y-b.y);
   if(length>Math.min(w,h)*.8)continue;
   ctx.strokeStyle='rgba(119,217,160,'+mix(.12,.2,pose.grid)+')';
   ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
  }
 }
 for(let i=0;i<count;i++){
  const p=points[i],r=(i%7===0?3.1:1.6)*(mobile ? 0.8 : 1),gold=i%9===0;
  ctx.beginPath();ctx.arc(p.x,p.y,r*3.2,0,Math.PI*2);ctx.fillStyle=gold?'rgba(212,196,145,.08)':'rgba(89,236,154,.075)';ctx.fill();
  ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fillStyle=gold?CORE_CONFIG.colors.gold:CORE_CONFIG.colors.emerald;ctx.fill();
 }
 const glowRadius=Math.max(2,Math.min(radius*.23,Math.min(w,h)*.45));
 const glow=ctx.createRadialGradient(cx,cy,0,cx,cy,glowRadius);
 glow.addColorStop(0,'rgba(222,255,233,.9)');glow.addColorStop(.08,'rgba(138,255,185,.8)');glow.addColorStop(.3,'rgba(48,228,127,.22)');glow.addColorStop(1,'rgba(35,176,105,0)');
 ctx.fillStyle=glow;ctx.fillRect(cx-glowRadius,cy-glowRadius,glowRadius*2,glowRadius*2);
}
