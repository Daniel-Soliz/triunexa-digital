import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Catalogue behavior must survive unavailable animation CDNs.
  await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
  await page.route('**/rest/v1/truinexa_public_leads*', route => route.fulfill({ json: [{id:'1',company:'Empresa de teste',segment:'Design',city:'São Paulo',state:'SP',neighborhood:'Centro',phone:'11999999999',whatsapp:'11999999999',website:'javascript:alert(1)',instagram_url:'https://instagram.com/example',source_url:'https://example.com',source_verified_at:'2026-11-05',company_summary:'Contato comercial público'}] }));
  await page.route('**/rest/v1/rpc/truinexa_public_heartbeat', route => route.fulfill({ json: null }));
  await page.route('**/rest/v1/rpc/truinexa_submit_feedback', route => route.fulfill({ json: null }));
});
test('abre sem login e permite buscar contatos e seguir desenvolvedor', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', {name:'Empresa de teste'})).toBeVisible();
  await expect(page.getByRole('link', {name:'@dsdigital.tech'})).toHaveAttribute('href','https://www.instagram.com/dsdigital.tech/');
  await expect(page.getByRole('link', {name:'@danielsoliz.ds'})).toHaveAttribute('href','https://www.instagram.com/danielsoliz.ds/');
  await expect(page.locator('a[href^="javascript:"]')).toHaveCount(0);
  await page.getByPlaceholder('Buscar empresa, segmento ou cidade').fill('inexistente');
  await expect(page.getByText('Nenhum resultado por aqui')).toBeVisible();
});
test('feedback opcional pode ser fechado e enviado', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', {name:'Deixar feedback',exact:true}).click();
  await page.getByRole('button', {name:'Agora não'}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', {name:'Deixar feedback',exact:true}).click();
  await page.getByLabel('Sua sugestão').fill('Gostei da plataforma e gostaria de mais filtros.');
  await page.getByRole('button', {name:'Enviar feedback'}).click();
  await expect(page.getByText('Obrigado por ajudar a plataforma a evoluir!')).toBeVisible();
});
test('painel exige credenciais e não oferece cadastro público', async ({ page }) => {
  await page.goto('/#adm');
  await expect(page.getByLabel('E-mail administrativo')).toBeVisible();
  await expect(page.getByLabel('Senha', {exact:true})).toBeVisible();
  await expect(page.getByText('Visitas totais', {exact:true})).toHaveCount(0);
  await expect(page.getByRole('button', {name:'Criar conta'})).toHaveCount(0);
});

test('ficha abre pelo nome, mostra contatos e fecha por Escape',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Ver informações de Empresa de teste',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Empresa de teste'});
 await expect(dialog).toBeVisible();
 await expect(dialog.getByText('Perfil ainda não confirmado')).toHaveCount(0);
 await expect(dialog.getByText('Nome não publicado nas fontes verificadas')).toBeVisible();
 await expect(dialog.getByText('Não publicado nas fontes verificadas',{exact:true})).toBeVisible();
 await expect(dialog.locator('a[href^="javascript:"]')).toHaveCount(0);
 await page.keyboard.press('Escape');
 await expect(dialog).toHaveCount(0);
});
test('categorias preservam busca e exibem vazio sem empresas fictícias',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:/^Advocacia/}).click();
 await expect(page.getByText('Nenhum resultado por aqui')).toBeVisible();
 await page.getByRole('button',{name:'Limpar filtros'}).click();
 await expect(page.getByRole('heading',{name:'Empresa de teste'})).toBeVisible();
});
test('mobile e movimento reduzido mantêm o catálogo utilizável sem CDN',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
 await page.goto('/#empresas');
 await expect(page.getByRole('heading',{name:'Empresa de teste'})).toBeVisible();
 await page.getByRole('button',{name:'Ver catálogo de informações'}).click();
 await expect(page.getByRole('dialog',{name:'Empresa de teste'})).toBeVisible();
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
 expect(overflow).toBe(false);
});
test('PWA e âncora do catálogo permanecem presentes',async({page})=>{
 await page.goto('/');
 await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href',/manifest.webmanifest/);
 await expect(page.getByRole('link',{name:'Explorar empresas'})).toHaveAttribute('href','#empresas');
});
