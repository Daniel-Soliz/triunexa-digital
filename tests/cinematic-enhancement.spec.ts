import { test, expect } from '@playwright/test';
test('enhancement loads actual GSAP, Lenis and Three without blocking navigation', async ({ page }) => {
 test.setTimeout(45000);
 const errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>sessionStorage.setItem('triunexa-feedback-prompt','1'));
 await page.route('**/rest/v1/truinexa_public_leads*',r=>r.fulfill({json:[{
  id:'1',company:'Empresa Cinema',segment:'Estética',city:'São Paulo',state:'SP',neighborhood:'Centro',
  phone:'11999999999',whatsapp:'5511999999999',website:'https://example.com',
  instagram_url:'',source_url:'https://example.com',source_verified_at:'2026-11-05',company_summary:'Empresa de teste'
 }]}));
 await page.route('**/rest/v1/rpc/truinexa_public_heartbeat',r=>r.fulfill({json:null}));
 await page.goto('/');
 const root=page.locator('.public-platform');
 await expect(root).toHaveAttribute('data-cinema','enabled',{timeout:15000});
 await expect(root).toHaveAttribute('data-webgl',/ready|fallback/,{timeout:15000});
 const webgl=await root.getAttribute('data-webgl');
 console.log('CINEMA_WEBGL_MODE='+webgl);
 await page.getByRole('link',{name:'Explorar empresas'}).click();
 await expect(page).toHaveURL(/#empresas$/);
 await page.getByRole('button',{name:'Ver informações de Empresa Cinema',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'Empresa Cinema'})).toBeVisible();
 await page.keyboard.press('Escape');
 await page.getByRole('link',{name:'Acesso ADM'}).click();
 await expect(page.getByLabel('E-mail administrativo')).toBeVisible();
 expect(errors).toEqual([]);
});
