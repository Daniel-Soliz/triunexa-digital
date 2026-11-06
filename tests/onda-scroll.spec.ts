import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('triunexa-feedback-prompt', '1'));
  await page.route('**/rest/v1/truinexa_public_leads*', route => route.fulfill({ json: [] }));
  await page.route('**/rest/v1/rpc/truinexa_public_heartbeat', route => route.fulfill({ json: null }));
});

test('rolagem conduz a cena e retornar ao topo reverte a sequência', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  const progress = () => page.locator('.public-platform').evaluate(el => Number(el.style.getPropertyValue('--hero-progress')));
  const scene = page.locator('.onda-hero-stage');
  const before = await scene.evaluate(el => getComputedStyle(el).transform);
  await page.evaluate(() => scrollTo(0, 350));
  await expect.poll(progress).toBeGreaterThan(.2);
  await expect.poll(() => scene.evaluate(el => getComputedStyle(el).transform)).not.toBe(before);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.evaluate(() => scrollTo(0, 0));
  await expect.poll(progress).toBe(0);
});

test('fundo tem movimento autônomo e a pausa interrompe o loop', async ({ page }) => {
  await page.goto('/');
  const flow = page.locator('.onda-nebula-flow');
  await expect(flow).toHaveCSS('animation-name', 'onda-nebula-drift');
  await page.getByRole('button', { name: 'Pausar animações' }).click();
  await expect(flow).toHaveCSS('animation-name', 'none');
});

test('movimento reduzido remove a cena presa à rolagem no desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.onda-hero')).toHaveCSS('position', 'relative');
  const hero = await page.locator('.onda-hero').boundingBox();
  const journey = await page.locator('.onda-hero-journey').boundingBox();
  expect(Math.abs(hero!.height - journey!.height)).toBeLessThan(2);
});

test('logo retorna ao início exato da sequência orbital', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#empresas');
  await page.getByRole('link', { name: 'TRIUNEXA DIGITAL, voltar ao início' }).click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(2);
  await expect.poll(() => page.locator('.public-platform').evaluate(el => Number(el.style.getPropertyValue('--hero-progress')))).toBe(0);
});

test('pausar remove o trecho extra de rolagem da cena', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Pausar animações' }).click();
  const hero = await page.locator('.onda-hero').boundingBox();
  const journey = await page.locator('.onda-hero-journey').boundingBox();
  expect(Math.abs(hero!.height - journey!.height)).toBeLessThan(2);
  await expect(page.locator('.onda-hero')).toHaveCSS('position', 'relative');
});

test('tela estreita usa rolagem livre sem espaço extra nem recortar a busca', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 900 });
  await page.goto('/');
  await page.evaluate(() => scrollTo(0, 350));
  await expect(page.locator('.onda-hero')).toHaveCSS('position', 'relative');
  const hero = await page.locator('.onda-hero').boundingBox();
  const journey = await page.locator('.onda-hero-journey').boundingBox();
  expect(Math.abs(hero!.height - journey!.height)).toBeLessThan(2);
  expect((await page.locator('.onda-hero-search').boundingBox())!.x).toBeGreaterThanOrEqual(0);
});
