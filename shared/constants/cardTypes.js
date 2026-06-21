export const CARD_TYPES = [
  {
    id: 'attack',
    name: 'Атака',
    icon: 'game-icons:crossed-swords',
    color: '#ef4444',
  },
  {
    id: 'defense',
    name: 'Защита',
    icon: 'bxs:shield',
    color: '#2563eb',
  },
  {
    id: 'hybrid',
    name: 'Универсальная',
    icon: 'game-icons:shield-reflect',
    color: '#9333ea',
  },
  {
    id: 'effect',
    name: 'Эффект',
    icon: 'game-icons:burning-meteor',
    color: '#f59e0b',
  },
];

/** В каких фазах можно сыграть карту как основную (не бонус). */
export const CARD_PLAY_PHASES = {
  attack: ['ATTACK'],
  defense: ['DEFENSE'],
  effect: ['EFFECT'],
  hybrid: ['ATTACK', 'DEFENSE'],
};

export const getCardType = typeId => CARD_TYPES.find(c => c.id === typeId) ?? {};
