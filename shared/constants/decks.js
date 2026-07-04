export const DECK_LABELS = [
  { id: 'deck', name: 'Колода' },
  { id: 'hand', name: 'Рука' },
  { id: 'discard', name: 'Сброс' },
];

export const CARD_ZONES = DECK_LABELS.map(({ id }) => id);

export const emptyCardZoneVisibility = () =>
  Object.fromEntries(CARD_ZONES.map(zone => [zone, false]));
