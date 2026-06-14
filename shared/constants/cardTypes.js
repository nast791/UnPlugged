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

export const getCardType = typeId => CARD_TYPES.find(c => c.id === typeId) ?? {};
