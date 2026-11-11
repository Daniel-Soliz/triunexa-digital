import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('triunexa-feedback-prompt', '1'));
  await page.route('**/rest/v1/rpc/truinexa_public_feed', route => route.fulfill({ json: [{
    id: '1', company: 'Empresa Cinema', segment: 'Estética', city: 'São Paulo', state: 'SP',
    neighborhood: 'Centro', phone: '11999999999', whatsapp: '5511999999999',
    website: 'https://example.com', instagram_url: '', source_url: 'https://example.com',
    source_verified_at: '2026-11-05', company_summary: 'Empresa de teste',
  }] }));
  await page.route('**/rest/v1/rpc/truinexa_public_claim', route => route.fulfill({ json: [{
    id: '1', company: 'Empresa Cinema', segment: 'Estética', city: 'São Paulo', state: 'SP',
    neighborhood: 'Centro', phone: '11999999999', whatsapp: '5511999999999',
    website: 'https://example.com', instagram_url: '', source_url: 'https://example.com',
    source_verified_at: '2026-11-05', company_summary: 'Empresa de teste',
  }] }));
  await page.route('**/rest/v1/rpc/truinexa_public_heartbeat', route => route.fulfill({ json: null }));
});

test('landing pública preserva identidade Onda e catálogo real', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.public-platform')).toHaveClass(/onda-view/);
  await expect(page.getByRole('heading', { level: 1, name: 'Boas conexões. Novas possibilidades.' })).toBeVisible();
  await expect(page.locator('.onda-image-aperture img')).toHaveAttribute('src', /onda-orbit\.jpg$/);
  await expect(page.getByRole('heading', { name: 'Empresa Cinema' })).toBeVisible();
  await expect(page.locator('.core-canvas')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Explorar empresas' })).toHaveAttribute('href', '#empresas');
});

test('busca da abertura leva aos filtros sem alterar a ficha comercial', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('O que você procura?').fill('Cinema');
  await page.getByRole('button', { name: 'Pesquisar no catálogo' }).click();
  await expect(page).toHaveURL(/#empresas$/);
  await expect(page.getByLabel('Buscar empresas', { exact: true })).toHaveValue('Cinema');
  await page.getByRole('button', { name: /^Advocacia/ }).click();
  await expect(page.getByText('Nenhum resultado por aqui')).toBeVisible();
  await page.getByRole('button', { name: 'Limpar filtros ×' }).click();
  await page.getByRole('button', { name: 'Ver informações de Empresa Cinema' }).click();
  await expect(page.getByRole('dialog', { name: 'Empresa Cinema' })).toBeVisible();
});

test('menu compacto, catálogo e ADM continuam acessíveis no celular', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await expect(page.getByRole('link', { name: 'Como funciona' })).toBeVisible();
  await page.getByRole('link', { name: 'Catálogo', exact: true }).click();
  await expect(page).toHaveURL(/#empresas$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Reservar e ver informações' }).click();
  await expect(page.getByRole('dialog', { name: 'Empresa Cinema' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: 'Acesso ADM' }).click();
  await expect(page.getByLabel('E-mail administrativo')).toBeVisible();
});

test('movimento reduzido desativa rotação da imagem e do anel', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  for (const orbit of await page.locator('.onda-orbit').all()) {
    await expect(orbit).toHaveCSS('animation-name', 'none');
  }
  await expect(page.locator('.onda-image-aperture img')).toHaveCSS('animation-name', 'none');
});
