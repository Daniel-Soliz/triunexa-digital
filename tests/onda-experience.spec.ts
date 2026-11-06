import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('triunexa-feedback-prompt', '1'));
  await page.route('**/rest/v1/truinexa_public_leads*', route => route.fulfill({ json: [{
    id: '1', company: 'Conexões & Serviços com um nome comercial bastante longo', segment: 'Design', city: 'São Paulo', state: 'SP',
    neighborhood: 'Centro', phone: '', whatsapp: '', website: '', instagram_url: '',
    source_url: 'https://example.com', source_verified_at: '2026-11-05', company_summary: 'Informações comerciais públicas para conectar empresas e pessoas.',
  }] }));
  await page.route('**/rest/v1/rpc/truinexa_public_heartbeat', route => route.fulfill({ json: null }));
});

test('a cena responde ao mouse e pode ser pausada sem bloquear a busca', async ({ page }) => {
  await page.goto('/');
  const root = page.locator('.public-platform');
  await expect(root).toHaveAttribute('data-motion', 'full');
  await page.mouse.move(1100, 300);
  await expect.poll(() => root.evaluate(el => el.style.getPropertyValue('--pointer-x'))).not.toBe('');
  await page.getByRole('button', { name: 'Pausar animações' }).click();
  await expect(root).toHaveAttribute('data-motion', 'paused');
  await page.getByLabel('O que você procura?', { exact: true }).fill('Serviços');
  await page.getByRole('button', { name: 'Pesquisar no catálogo' }).click();
  await expect(page.getByLabel('Buscar empresas', { exact: true })).toHaveValue('Serviços');
  await expect(page.getByRole('heading', { name: /Conexões & Serviços/ })).toBeVisible();
  await page.getByRole('button', { name: 'Retomar animações' }).click();
  await expect(root).toHaveAttribute('data-motion', 'full');
});

test('movimento reduzido vence a preferência de animação e funciona a 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.public-platform')).toHaveAttribute('data-motion', 'reduced');
  await expect(page.locator('.onda-orb')).toHaveAttribute('data-animated', 'false');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const searchBox = await page.locator('.onda-hero-search').boundingBox();
  const copyBox = await page.locator('.onda-hero-copy').boundingBox();
  expect(Math.abs(searchBox!.x - copyBox!.x)).toBeLessThan(2);
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await page.getByRole('link', { name: 'Como funciona', exact: true }).click();
  await expect(page).toHaveURL(/#como-funciona$/);
});

test('sem WebGL a imagem alternativa mantém a experiência e a navegação', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type.includes('webgl')) return null;
      return original.apply(this, [type, ...args] as Parameters<typeof original>);
    } as typeof original;
  });
  await page.goto('/');
  await expect(page.locator('.onda-orb')).toHaveAttribute('data-renderer', 'fallback');
  await expect(page.locator('.onda-image-aperture img')).toBeVisible();
  await expect(page.locator('.onda-image-aperture img')).toHaveCSS('animation-name', 'none');
  await page.getByRole('link', { name: 'Explorar empresas', exact: true }).click();
  await expect(page).toHaveURL(/#empresas$/);
  await page.getByRole('button', { name: /Ver informações de Conexões/ }).click();
  await expect(page.getByRole('dialog', { name: /Conexões & Serviços/ })).toBeVisible();
});

test('trocar a preferência do sistema interrompe o movimento em tempo real', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.public-platform')).toHaveAttribute('data-motion', 'full');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.public-platform')).toHaveAttribute('data-motion', 'reduced');
  await expect(page.locator('.onda-orb')).toHaveAttribute('data-animated', 'false');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('.public-platform')).toHaveAttribute('data-motion', 'full');
});

test('efeitos saem de cena ao rolar e retornam ao voltar ao início', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.public-platform')).toHaveAttribute('data-scene-active', 'true');
  await page.locator('#como-funciona').scrollIntoViewIfNeeded();
  await expect(page.locator('.public-platform')).toHaveAttribute('data-scene-active', 'false');
  if (await page.locator('.onda-orb').getAttribute('data-renderer') === 'webgl') {
    await expect(page.locator('.onda-orb')).toHaveAttribute('data-visible', 'false');
  }
  await page.evaluate(() => scrollTo(0, 0));
  await expect(page.locator('.public-platform')).toHaveAttribute('data-scene-active', 'true');
});

test('menu aberto pelo teclado recebe foco e Escape devolve ao botão', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Abrir menu' });
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('link', { name: 'Catálogo', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Como funciona', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('pausar congela a cena sem reconstruir os shaders', async ({ page }) => {
  await page.addInitScript(() => {
    const original = WebGLRenderingContext.prototype.createShader;
    const counts = { shaders: 0 };
    Object.assign(window, { __triunexaGLCheck: counts });
    WebGLRenderingContext.prototype.createShader = function (type: number) {
      counts.shaders++;
      return original.call(this, type);
    };
  });
  await page.goto('/');
  await expect(page.locator('.public-platform')).toHaveAttribute('data-scene-active', 'true');
  test.skip(await page.locator('.onda-orb').getAttribute('data-renderer') !== 'webgl', 'Navegador sem WebGL: a alternativa estática é verificada em outro teste.');
  const count = () => page.evaluate(() => (window as unknown as { __triunexaGLCheck: { shaders: number } }).__triunexaGLCheck.shaders);
  await expect.poll(count).toBeGreaterThan(0);
  const before = await count();
  await page.getByRole('button', { name: 'Pausar animações' }).click();
  await expect(page.locator('.public-platform')).toHaveAttribute('data-motion', 'paused');
  expect(await count()).toBe(before);
  await page.getByRole('button', { name: 'Retomar animações' }).click();
  await expect(page.locator('.public-platform')).toHaveAttribute('data-motion', 'full');
  expect(await count()).toBe(before);
});
