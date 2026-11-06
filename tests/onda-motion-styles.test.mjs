import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const styles = readFileSync(new URL('../onda-experience.css', import.meta.url), 'utf8');

test('a esfera de reserva gira automaticamente e acompanha o progresso da rolagem', () => {
  assert.match(styles, /\.onda-view \.onda-orb\[data-renderer="fallback"\] \.onda-image-aperture img\s*\{[^}]*animation:\s*onda-rotate /);
  assert.match(styles, /\.onda-view \.onda-orb\[data-renderer="fallback"\] \.onda-image-aperture\s*\{[^}]*--hero-progress/);
});

test('a preferência de pausa e movimento reduzido continua desativando animações', () => {
  assert.match(styles, /\.onda-view:not\(\[data-motion="full"\]\) \*[^\n]*animation:\s*none\s*!important/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});
