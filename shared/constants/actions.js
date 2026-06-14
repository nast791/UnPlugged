export const ACTIONS = [
  {
    id: 'movement',
    name: 'Движение',
    desc: 'Доберите карту и передвиньте своих бойцов.',
    color: '#10b981',
  },
  {
    id: 'attack',
    name: 'Атака',
    desc: 'Выберите цель и совершите нападение.',
    color: '#ef4444',
  },
  {
    id: 'effect',
    name: 'Эффект',
    desc: 'Разыграйте карту с немедленным действием.',
    color: '#f59e0b',
  },
];

export const ACTION_LABELS = Object.fromEntries(ACTIONS.map(a => [a.id, a.name]));

export const getAction = id => ACTIONS.find(a => a.id === id);
