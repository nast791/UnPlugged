import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

/** cardId:actionId → описание шага pipeline */
const DESCRIPTIONS = {
  // --- Medusa ---
  'medusa_01:extra_damage': 'Нанести 8 урона защитнику после победы в битве',

  'medusa_02:ask_apply': 'Спросить: прибавить бонус другой карты к силе атаки?',
  'medusa_02:pick_card': 'Выбрать карту из руки для бонуса',
  'medusa_02:add_bonus': 'Прибавить бонус выбранной карты к силе атаки',
  'medusa_02:move_bonus_to_discard': 'Сбросить карту-бонус из руки',

  'medusa_03:pick_discard': 'Оппонент выбирает 1 карту из руки',
  'medusa_03:discard': 'Переместить выбранную карту оппонента в сброс',

  'medusa_04:ask_move': 'Спросить: передвигать гарпий (до 3 клеток)?',
  'medusa_04:finish_skip': 'Завершить — передвижение отменено',
  'medusa_04:select_harpy': 'Выбрать гарпию для перемещения',
  'medusa_04:select_cell': 'Выбрать клетку назначения (до 3 шагов)',
  'medusa_04:apply_move': 'Переместить гарпию на выбранную клетку',
  'medusa_04:finish_done': 'Завершить — все гарпии передвинуты',
  'medusa_04:loop': 'Повторить цикл, если остались гарпии в очереди',

  'medusa_05:pick_discard': 'Оппонент выбирает 1 карту из руки',
  'medusa_05:discard': 'Переместить выбранную карту оппонента в сброс',

  'medusa_06:ask_move': 'Спросить: передвинуть бойца этой битвы (до 3 клеток)?',
  'medusa_06:finish_skip': 'Завершить — передвижение отменено',
  'medusa_06:select_cell': 'Выбрать клетку для бойца битвы (до 3 шагов)',
  'medusa_06:apply_move': 'Переместить бойца битвы на выбранную клетку',

  'medusa_07:draw': 'Добрать 1 карту с верха колоды в руку',

  'medusa_08:ignore': 'Игнорировать текстовые свойства карты оппонента в бою',

  'medusa_09:draw_win': 'При победе — добрать 2 карты из колоды',
  'medusa_09:draw_loss': 'При поражении — добрать 1 карту из колоды',

  'medusa_10:pick_target': 'Выбрать бойца в области Медузы',
  'medusa_10:deal_damage': 'Нанести 2 урона выбранному бойцу',

  'medusa_11:ask_move': 'Спросить: передвинуть следующего своего бойца?',
  'medusa_11:skip_all_moves': 'Отказ от передвижения — пропустить фазу перемещения',
  'medusa_11:select_fighter': 'Выбрать своего бойца для перемещения',
  'medusa_11:select_cell': 'Выбрать клетку (до 3 шагов, проход сквозь врагов)',
  'medusa_11:apply_move': 'Переместить бойца и убрать из очереди',
  'medusa_11:loop': 'Повторить цикл перемещения для оставшихся бойцов',
  'medusa_11:finish_moves': 'Лог: передвижение завершено, переход к воскрешению',
  'medusa_11:finish': 'Завершить — нет мёртвых гарпий для воскрешения',
  'medusa_11:select_spawn': 'Выбрать свободную клетку в зоне Медузы',
  'medusa_11:resurrect': 'Воскресить гарпию на выбранной клетке',

  // --- Tesla ---
  'tesla_01:choose': 'Выбор: активировать катушки или деактивировать и лечить',
  'tesla_01:activate_coils': 'Активировать обе катушки',
  'tesla_01:deactivate_coils': 'Деактивировать обе катушки (если есть активные)',
  'tesla_01:heal_hero': 'Восстановить Тесле 2 HP после деактивации катушек',

  'tesla_02:ask_deactivate': 'Спросить: деактивировать катушки?',
  'tesla_02:finish_skip': 'Завершить — катушки не тронуты',
  'tesla_02:set_one_coil': 'Автовыбор: деактивировать 1 катушку (активна только одна)',
  'tesla_02:ask_count_two': 'Выбор: деактивировать 1 или 2 катушки',
  'tesla_02:deactivate_coils': 'Деактивировать выбранное число катушек',
  'tesla_02:grant_action': 'Дать 1 дополнительное действие (деактивация 1 или 2 катушек)',
  'tesla_02:draw_card': 'Добрать 1 карту из колоды (деактивация 2 катушек)',
  'tesla_02:finish': 'Завершить эффект «Низкая частота»',

  'tesla_03:ask_deactivate': 'Спросить: деактивировать катушки для усиления атаки?',
  'tesla_03:finish_skip': 'Завершить — катушки не тронуты',
  'tesla_03:set_one_coil': 'Автовыбор: деактивировать 1 катушку',
  'tesla_03:ask_count_two': 'Выбор: деактивировать 1 или 2 катушки',
  'tesla_03:deactivate_coils': 'Деактивировать выбранное число катушек',
  'tesla_03:set_value_5': 'Установить силу атаки = 5 (деактивация 1 катушки)',
  'tesla_03:set_value_7': 'Установить силу атаки = 7 (деактивация 2 катушек)',

  'tesla_04:draw_initial': 'Добрать 1 карту (базовый эффект карты)',
  'tesla_04:ask_deactivate': 'Спросить: деактивировать катушки?',
  'tesla_04:finish_skip': 'Завершить — катушки не тронуты',
  'tesla_04:set_one_coil': 'Автовыбор: деактивировать 1 катушку',
  'tesla_04:ask_count_two': 'Выбор: деактивировать 1 или 2 катушки',
  'tesla_04:deactivate_coils': 'Деактивировать выбранное число катушек',
  'tesla_04:draw_one_coil': 'Добрать ещё 1 карту (деактивация 1 катушки)',
  'tesla_04:draw_two_coils': 'Добрать ещё 2 карты (деактивация 2 катушек)',
  'tesla_04:heal_tesla': 'Восстановить Тесле 1 HP (деактивация 2 катушек)',
  'tesla_04:finish': 'Завершить эффект «Научный прорыв»',

  'tesla_05:reveal_top': 'Показать верхнюю карту колоды оппонента',
  'tesla_05:return_revealed':
    'Вернуть показанную карту на верх колоды (нет катушек или отказ от деактивации)',
  'tesla_05:finish_without_coils': 'Завершить без эффекта катушек (нет катушек или отказ)',
  'tesla_05:ask_deactivate': 'Спросить: деактивировать катушки?',
  'tesla_05:set_one_coil': 'Автовыбор: деактивировать 1 катушку',
  'tesla_05:ask_count_two': 'Выбор: деактивировать 1 или 2 катушки',
  'tesla_05:deactivate_coils': 'Деактивировать выбранное число катушек',
  'tesla_05:add_revealed_bonus': 'Прибавить бонус показанной карты к атаке (2 катушки)',
  'tesla_05:move_revealed_to_discard': 'Сбросить показанную карту оппонента (1+ катушка)',
  'tesla_05:finish': 'Завершить эффект «Рентгеновское излучение»',

  'tesla_06:ask_deactivate': 'Спросить: деактивировать катушки для урона по всем бойцам оппонентов в области?',
  'tesla_06:finish_skip': 'Завершить — катушки не тронуты',
  'tesla_06:set_one_coil': 'Автовыбор: деактивировать 1 катушку',
  'tesla_06:ask_count_two': 'Выбор: деактивировать 1 или 2 катушки',
  'tesla_06:deactivate_coils': 'Деактивировать выбранное число катушек',
  'tesla_06:damage_one': 'Нанести 1 урон каждому бойцу любого оппонента в области (1 катушка)',
  'tesla_06:damage_two': 'Нанести 2 урона каждому бойцу любого оппонента в области (2 катушки)',
  'tesla_06:finish': 'Завершить эффект «Грозовой шквал»',
};

/** skillId:triggerId:actionId → описание шага pipeline скилла */
const SKILL_DESCRIPTIONS = {
  'medusa_skill:gaze:ask_apply': 'Спросить: применить способность «Взгляд Медузы»?',
  'medusa_skill:gaze:finish_skip': 'Завершить — способность не применена',
  'medusa_skill:gaze:pick_target': 'Выбрать вражеского бойца в области Медузы',
  'medusa_skill:gaze:deal_damage': 'Нанести 1 урон выбранной цели',

  'tesla_skill:init_coils:activate_first_coil': 'Активировать 1 катушку в начале игры',
  'tesla_skill:charge_coil:activate_coil': 'Активировать 1 неактивную катушку в конце хода',
  'tesla_skill:discharge:coil_damage':
    'Нанести 1 урон каждому врагу на соседней с Теслой клетке',
  'tesla_skill:discharge:ask_move': 'Спросить: переместить соседнего вражеского бойца?',
  'tesla_skill:discharge:finish_skip': 'Завершить — передвижение отменено',
  'tesla_skill:discharge:select_target': 'Выбрать соседнего вражеского бойца из списка',
  'tesla_skill:discharge:select_cell': 'Выбрать клетку назначения (до 1 шага)',
  'tesla_skill:discharge:apply_move': 'Переместить выбранного бойца на 1 клетку',
  'tesla_skill:discharge:finish_done': 'Завершить — все соседние бойцы обработаны',
  'tesla_skill:discharge:loop': 'Повторить цикл для оставшихся соседних бойцов',
};

function annotateCards(cards) {
  let missing = [];
  for (const card of cards) {
    for (const trigger of card.triggers ?? []) {
      for (const action of trigger.actions ?? []) {
        const key = `${card.id}:${action.id}`;
        const description = DESCRIPTIONS[key];
        if (!description) {
          missing.push(key);
          continue;
        }
        action.description = description;
      }
    }
  }
  return missing;
}

function annotateSkill(skill) {
  let missing = [];
  for (const trigger of skill.triggers ?? []) {
    for (const action of trigger.actions ?? []) {
      const key = `${skill.id}:${trigger.id}:${action.id}`;
      const description = SKILL_DESCRIPTIONS[key];
      if (!description) {
        missing.push(key);
        continue;
      }
      action.description = description;
    }
  }
  return missing;
}

function processHeroIndex(absPath, indent = 2) {
  const pack = JSON.parse(fs.readFileSync(absPath, 'utf8'));
  if (!pack.skill) return [];
  const missing = annotateSkill(pack.skill);
  const space = indent === '\t' ? '\t' : ' '.repeat(indent);
  fs.writeFileSync(absPath, `${JSON.stringify(pack, null, space)}\n`);
  return missing;
}

function syncSkillFixtures(medusaSkill, teslaSkill) {
  const out = `/** Зеркало skill из heroes/medusa/index.json и heroes/tesla/index.json (Unplugged-pack). */

export const medusaSkill = ${JSON.stringify(medusaSkill, null, 2)};

export const teslaSkill = ${JSON.stringify(teslaSkill, null, 2)};
`;
  fs.writeFileSync(path.join(root, 'test/skillFixtures.mjs'), out);
}

function processFile(relPath) {
  const filePath = path.join(root, relPath);
  const cards = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const missing = annotateCards(cards);
  fs.writeFileSync(filePath, `${JSON.stringify(cards, null, 2)}\n`);
  return { relPath, missing, count: cards.flatMap(c => c.triggers?.flatMap(t => t.actions) ?? []).length };
}

const files = [
  'shared/mocks/medusa-cards.json',
  'shared/mocks/tesla-cards.json',
];

let allMissing = [];
for (const f of files) {
  const { missing, count } = processFile(f);
  allMissing.push(...missing);
  console.log(`${f}: annotated`);
}

const medusaIndex = path.join(root, '../Unmatched-pack/heroes/medusa/index.json');
const teslaIndex = path.join(root, '../Unmatched-pack/heroes/tesla/index.json');
allMissing.push(...processHeroIndex(medusaIndex, '\t'));
allMissing.push(...processHeroIndex(teslaIndex, 2));
console.log('hero index.json skills: annotated');

const medusaPack = JSON.parse(fs.readFileSync(medusaIndex, 'utf8'));
const teslaPack = JSON.parse(fs.readFileSync(teslaIndex, 'utf8'));
syncSkillFixtures(medusaPack.skill, teslaPack.skill);
console.log('test/skillFixtures.mjs: synced');

if (allMissing.length) {
  console.error('Missing descriptions:', allMissing);
  process.exit(1);
}
