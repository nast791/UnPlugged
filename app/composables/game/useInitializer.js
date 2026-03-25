import { useGameStore } from '~/store/game.js';
import useUtils from '~/composables/useUtils';

export default function () {
  const { players, map, activePlayerIndex } = storeToRefs(useGameStore());
  const { shuffle } = useUtils();
  const nuxtConfig = useRuntimeConfig();

  const runInit = () => {
    players.value = players.value?.map((player, index) => {
      const fullDeck = [];
      player.cards.forEach(card => {
        const qty = card.quantity || 1;
        for (let i = 0; i < qty; i++) {
          fullDeck.push({ ...card, instanceId: `${card.id}_${i}` });
        }
      });
      const shuffledCards = shuffle(fullDeck);

      const fighters = player.heroes?.map(i => {
        const info = {
          type: 'hero',
          image: `${nuxtConfig.public.pack}${player.folder}${i.image}`,
          currentHp: i.hp,
          position: null,
          acted: false,
          active: false
        }

        return {...i, ...info};
      });

      player.assistants?.forEach(i => {
        for (let item = 0; item < (i.count || 1); item++) {
          const info = {
            type: 'assistant',
            currentHp: i.hp,
            position: null,
            image: `${nuxtConfig.public.pack}${player.folder}${i.image}`,
            acted: false,
            active: false
          };
          if (i.count) {
            info.group = i.id;
            info.id = `${i.id}_${item + 1}`;
          }
          fighters.push({
            ...i,
            ...info,
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

      return {
        ...player,
        items,
        fighters,
        hand: shuffledCards.splice(0, 5),
        deck: shuffledCards,
        discard: [],
        actionsPoints: 2,
        actionsUsed: 0
      };
    });

    const radius = map.value?.settings?.nodeSize / 2;

    const circles = computed(() => {
      return (map.value?.nodes || []).map(node => ({
        ...node,
        x: node.x + radius,
        y: node.y + radius,
      }));
    });

    const connections = computed(() => {
      const res = [];
      circles.value.forEach(node => {
        node.neighbors?.forEach(neighborId => {
          const nId = Number(neighborId);
          const cId = Number(node.id);

          if (nId > cId) {
            const target = circles.value.find(i => Number(i.id) === nId);
            if (target) {
              res.push({
                points: [node.x, node.y, target.x, target.y],
                id: `l-${cId}-${nId}`,
              });
            }
          }
        });
      });
      return res;
    });

    map.value = {
      ...map.value,
      radius,
      circles, 
      connections, 
      selectedCircle: null, 
      reachableCircles: []
    }

    activePlayerIndex.value = 1;
  };

  return { runInit };
}
