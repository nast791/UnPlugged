import useUtils from '~/composables/useUtils';

export default function () {
  const { shuffle } = useUtils();

  const createFighter = (data, startNodeId, role) => {
    const { config, cards, info } = data;

    const fullDeck = [];
    cards.forEach(card => {
      const qty = card.quantity || 1;
      for (let i = 0; i < qty; i++) {
        fullDeck.push({ ...card, instanceId: `${card.id}_${i}` });
      }
    });

    const nuxtConfig = useRuntimeConfig();

    const fighters = config.heroes.map((i, idx) => ({
      ...i,
      ...{
        active: idx === 0,
        index: idx,
        type: 'hero',
        currentHp: i.hp,
        position: startNodeId,
        imageSrc: `${nuxtConfig.public.pack}${info.folder}/${i.image}`
      },
    }));

    if (config.assistants?.length) {
      config.assistants.forEach(i => {
        const groupId = i.id;
        for (let item = 0; item < (i.count || 1); item++) {
          fighters.push({
            ...i,
            ...{
              id: `${i.id}_${item + 1}`,
              active: item === 0,
              index: item,
              groupId,
              type: 'assistant',
              currentHp: i.hp,
              position: null,
              imageSrc: `${nuxtConfig.public.pack}${info.folder}/${i.image}`
            },
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
      role,
      color: role === 'player' ? "#22d3ee" : "#f87171",
      fighters,
      items,
      hand: shuffledCards.splice(0, 5),
      deck: shuffledCards,
      discard: [],
    };
  };

  const createMap = data => {
    const { config, info } = data;

    const size = config.settings?.nodeSize || 40;
    const radius = size / 2;

    const nodes = computed(() => {
      return (config.nodes || []).map(node => ({
        ...node,
        x: node.x + radius,
        y: node.y + radius,
      }));
    });

    const connections = computed(() => {
      const res = [];
      nodes.value.forEach(node => {
        node.neighbors?.forEach(neighborId => {
          const nId = Number(neighborId);
          const cId = Number(node.id);

          if (nId > cId) {
            const target = nodes.value.find(n => Number(n.id) === nId);
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

    return {
      id: config.id,
      name: config.name,
      settings: config.settings,
      assets: config.assets,
      nodes,
      connections,
      imageSrc: info.image,
      selectedCircle: null,
      reachableCircles: [] 
    };
  };

  return { createFighter, createMap };
}
