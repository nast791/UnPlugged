import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const coreRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Корень контент-пака (тот же источник, что `config.public.pack` в приложении). */
export const getPackRoot = () => process.env.PACK_ROOT || join(coreRoot, '../Unmatched-pack');

export const loadPackRegistry = () => {
  const path = join(getPackRoot(), 'index.json');
  return JSON.parse(readFileSync(path, 'utf8'));
};

export const loadHeroCards = heroId => {
  const path = join(getPackRoot(), 'heroes', heroId, 'cards.json');
  return JSON.parse(readFileSync(path, 'utf8'));
};

export const loadHeroPack = heroId => {
  const path = join(getPackRoot(), 'heroes', heroId, 'index.json');
  return JSON.parse(readFileSync(path, 'utf8'));
};
