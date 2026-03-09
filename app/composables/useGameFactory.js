import useUtils from '~/composables/useUtils';

export default function () {
  const { shuffle } = useUtils();

  const createFighter = (data, startNodeId) => {
    const { config, cards, folder } = data;

    const fullDeck = [];
    cards.forEach(card => {
      const qty = card.quantity || 1;
      for (let i = 0; i < qty; i++) {
        fullDeck.push({ ...card, instanceId: `${card.id}_${i}` });
      }
    });

    const fighters = [
      {
        id: config.id,
        type: 'hero',
        name: config.name,
        hp: config.stats.hp,
        maxHp: config.stats.hp,
        position: startNodeId,
        image: config.assets.avatar,
      },
    ];

    if (config.assistants?.length) {
      config.assistants.forEach(as => {
        for (let i = 0; i < (as.count || 1); i++) {
          fighters.push({
            id: as.id,
            instanceId: `${as.id}_${i}`,
            type: 'sidekick',
            hp: as.hp,
            currentHp: as.hp,
            position: null,
            image: as.image,
          });
        }
      });
    }

    const items = [];
    if (config.extraItems?.length) {
      config.extraItems.forEach((group, index) => {
        const initialState = group[0];
        items.push({
          groupId: `item_group_${index}`,
          currentId: initialState.id,
          type: initialState.type,
          state: initialState.state,
          position: null,
          states: group,
        });
      });
    }

    const shuffledCards = shuffle(fullDeck);

    return {
      id: config.id,
      name: config.name,
      stats: config.stats,
      ability: config.ability,
      assets: config.assets,
      folder: folder,
      fighters,
      items,
      hand: shuffledCards.splice(0, 5),
      deck: shuffledCards,
      discard: [],
    };
  };

  const createMap = (mapData) => {
    const nodes = ref(mapData.nodes || []);

    const connections = computed(() => {
      const res = [];
      nodes.value.forEach(node => {
        node.neighbors?.forEach(neighborId => {
          if (Number(neighborId) > Number(node.id)) {
            const target = nodes.value.find(n => Number(n.id) === Number(neighborId));
            if (target) {
              res.push({
                points: [node.x, node.y, target.x, target.y],
                id: `l-${node.id}-${neighborId}`
              });
            }
          }
        });
      });
      return res;
    });

    return {
      id: mapData.id,
      name: mapData.name,
      settings: mapData.settings,
      assets: mapData.assets,
      nodes, 
      connections 
    };
  }

  return { createFighter, createMap };
}
