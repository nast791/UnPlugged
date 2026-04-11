import { useGameStore } from '~/store/game.js';
import { useAppStore } from '~/store/app';
import useUtils from '~/composables/useUtils';
import { getMap, getHeroes } from '~/composables/api/plugins';

export const useGameInit = () => {
  const store = useGameStore();
  const { shuffle } = useUtils();
  const nuxtConfig = useRuntimeConfig();
  const appStore = useAppStore();
  const human = computed(() => appStore.glossary?.meta?.players?.[0]);

  const runGameInit = async () => {
    const { suspense: suspenseMap } = getMap();
    const { suspense: suspenseHeroes } = getHeroes();
    
    await Promise.all([suspenseMap(), suspenseHeroes()]);
    const newGameId = crypto.randomUUID();
    store.id = newGameId;

    store.players = store.players.map((player) => {
      const fullDeck = [];
      player.cards.forEach(card => {
        const qty = card.quantity || 1;
        for (let i = 0; i < qty; i++) {
          fullDeck.push({ ...card, instanceId: `${card.id}_${i}` });
        }
      });
      const shuffledCards = shuffle(fullDeck);

      const fighters = player.heroes?.map(i => ({
        ...i,
        type: 'hero',
        image: `${nuxtConfig.public.pack}${player.folder}${i.image}`,
        currentHp: i.hp,
        position: null,
        active: false,
      })) || [];

      player.assistants?.forEach(i => {
        for (let item = 0; item < (i.count || 1); item++) {
          fighters.push({
            ...i,
            type: 'assistant',
            currentHp: i.hp,
            position: null,
            image: `${nuxtConfig.public.pack}${player.folder}${i.image}`,
            id: i.count ? `${i.id}_${item + 1}` : i.id,
            group: i.count ? i.id : null,
            active: false,
          });
        }
      });

      const items = [];
      player.items?.forEach(i => {
        for (let item = 0; item < (i.count || 1); item++) {
          const info = {};
          if (i.count) {
            info.group = i.id;
            info.id = `${i.id}_${item + 1}`;
          }
          items.push({
            ...i,
            ...info,
          });
        }
      });

      const isHuman = player.type === human.value?.id;
      return {
        ...player,
        items,
        fighters,
        hand: shuffledCards.splice(-5), 
        deck: shuffledCards,
        discard: [],
        visibility: {
          deck: false,
          hand: isHuman,
          discard: false
        },
        actionsPoints: 2,
        actionsUsed: 0,
      };
    });

    const radius = store.map?.settings?.nodeSize / 2;
    const circles = (store.map?.nodes || []).map(node => ({
      ...node,
      x: node.x + radius,
      y: node.y + radius,
    }));

    const connections = [];
    circles.forEach(node => {
      node.neighbors?.forEach(neighborId => {
        const nId = Number(neighborId);
        const cId = Number(node.id);
        if (nId > cId) {
          const target = circles.find(i => Number(i.id) === nId);
          if (target) {
            connections.push({
              points: [node.x, node.y, target.x, target.y],
              id: `l-${cId}-${nId}`,
            });
          }
        }
      });
    });

    store.map = {
      ...store.map,
      radius,
      circles,
      connections,
      selectedCircle: null,
      reachableCircles: [],
    };

    store.activePlayerIndex = 1; 

    store.phase = 'UNIT_PLACEMENT';
    await navigateTo(`/game/${newGameId}`);
  };

  return { runGameInit };
};