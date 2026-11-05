import { test, expect } from '@playwright/test';
import { frameForProgress, progressForScroll, chapterForProgress } from '../core/config';
import { corePose } from '../core/renderer';
import { parseManifest } from '../core/frames';
// Network mocks must own frame requests rather than the installed PWA worker.
test.use({serviceWorkers:'block'});
test.beforeEach(async({page})=>{
 await page.addInitScript(()=>sessionStorage.setItem('triunexa-feedback-prompt','1'));
 await page.route('**/rest/v1/truinexa_public_leads*',r=>r.fulfill({json:[{
  id:'1',company:'Empresa Cinema',segment:'Estética',city:'São Paulo',state:'SP',neighborhood:'Centro',
  phone:'11999999999',whatsapp:'5511999999999',website:'https://example.com',instagram_url:'',
  source_url:'https://example.com',source_verified_at:'2026-11-05',company_summary:'Empresa de teste'
 }]}));
 await page.route('**/rest/v1/rpc/truinexa_public_heartbeat',r=>r.fulfill({json:null}));
});
test('scroll chooses bounded frames and joins the five chapter poses continuously',()=>{
 expect(frameForProgress(-1)).toBe(0);expect(frameForProgress(1)).toBe(179);
 expect(frameForProgress(.5)).toBe(90);
 expect(chapterForProgress(1).name).toBe('final');
 const bounds=Array.from({length:5},(_,i)=>({top:i*2600,height:2600}));
 expect(progressForScroll(1300,bounds,1000)).toBeCloseTo(.1);
 expect(progressForScroll(999999,bounds,1000)).toBe(1);
 for(const boundary of [.2,.4,.6,.8]){
  const before=corePose(boundary-.00001),after=corePose(boundary+.00001);
  for(const key of ['scale','explode','rotation','travel'] as const)expect(Math.abs(before[key]-after[key])).toBeLessThan(.005);
 }
 expect(parseManifest({enabled:true,count:180,pattern:'../bad.webp'}).enabled).toBe(false);
 expect(parseManifest({enabled:true,count:180,pattern:'frame_{index}.webp'}).enabled).toBe(true);
});
test('original canvas responds to scroll and preserves contact and ADM navigation',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');
 const root=page.locator('.public-platform');
 await expect(root).toHaveAttribute('data-core-renderer','procedural');
 const first=Number(await root.getAttribute('data-core-frame'));
 await page.evaluate(()=>window.scrollTo(0,innerHeight*1.2));
 await expect.poll(async()=>Number(await root.getAttribute('data-core-frame'))).toBeGreaterThan(first);
 await expect(page.locator('.core-canvas')).toHaveCSS('pointer-events','none');
 expect(await page.locator('.core-canvas').evaluate((c:HTMLCanvasElement)=>{const ctx=c.getContext('2d')!;const pixels=ctx.getImageData(0,0,c.width,c.height).data;return pixels.some((v,i)=>i%4===3&&v>0);})).toBe(true);
 await page.getByRole('link',{name:'Catálogo',exact:true}).click();
 await expect(page).toHaveURL(/#empresas$/);
 await page.getByRole('button',{name:'Ver informações de Empresa Cinema',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'Empresa Cinema'})).toBeVisible();
 await page.keyboard.press('Escape');
 await page.getByRole('link',{name:'Acesso ADM'}).click();
 await expect(page.getByLabel('E-mail administrativo')).toBeVisible();
 expect(errors).toEqual([]);
});
test('reduced-motion keeps canvas static and mobile has no horizontal scroll',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
 await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 await page.goto('/');
 const root=page.locator('.public-platform');await expect(root).toHaveAttribute('data-motion','reduced');
 await expect(root).toHaveAttribute('data-core-renderer','procedural');
 const frame=await root.getAttribute('data-core-frame');
 await page.evaluate(()=>window.scrollTo(0,innerHeight*2));
 await expect(root).toHaveAttribute('data-core-frame',frame!);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('broken optional WebP frames fall back to original procedural geometry',async({page})=>{
 let manifestRequests=0;
 await page.route('**/core-frames/manifest.json',r=>{manifestRequests++;return r.fulfill({json:{enabled:true,count:180,pattern:'frame_{index}.webp',padding:4,start:1,fit:'cover'}});});
 let requests=0;
 await page.route('**/core-frames/*.webp',r=>{requests++;return r.fulfill({status:404,body:'not found'});});
 await page.goto('/');
 await expect(page.locator('.public-platform')).toHaveAttribute('data-core-renderer','procedural');
 await expect.poll(()=>manifestRequests).toBeGreaterThan(0);
 await expect.poll(()=>requests).toBeGreaterThan(0);
 expect(requests).toBeLessThanOrEqual(5);
 await expect(page.getByRole('link',{name:'Explorar empresas'})).toBeVisible();
});

test('valid WebP sequence draws frames with a bounded lazy window',async({page})=>{
 await page.goto('about:blank');
 const image=await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=4;canvas.height=4;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#284d35';ctx.fillRect(0,0,4,4);return canvas.toDataURL('image/webp');});
 await page.route('**/core-frames/manifest.json',r=>r.fulfill({json:{enabled:true,count:180,pattern:'frame_{index}.webp',padding:4,start:1,fit:'contain'}}));
 let requests=0;
 await page.route('**/core-frames/*.webp',r=>{requests++;return r.fulfill({contentType:'image/webp',body:Buffer.from(image.split(',')[1],'base64')});});
 await page.goto('/');
 await expect(page.locator('.public-platform')).toHaveAttribute('data-core-renderer','frames');
 expect(requests).toBeLessThanOrEqual(5);
});
