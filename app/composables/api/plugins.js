import useApi from '~/composables/api/_client';
import { useQueries } from '@tanstack/vue-query';
import { useGameStore } from '~/store/game.js';
import useUtils from '~/composables/useUtils';

export const usePlugins = () => {
  const config = useRuntimeConfig();

  const query = useQuery({
    queryKey: ['plugins-registry'],
    queryFn: () =>
      useApi()(`${config.public.pack}index.json?v=3`).then(data =>
        typeof data === 'string' ? JSON.parse(data) : data,
      ),
  });

  const heroes = computed(() => {
    if (!query.data.value?.heroes) return [];

    return query.data.value.heroes.map(hero => ({
      ...hero,
      image: `${config.public.pack}${hero.folder}${hero.image || 'avatar.webp'}`,
    }));
  });

  const maps = computed(() => {
    if (!query.data.value?.maps) return [];

    return query.data.value.maps.map(map => ({
      ...map,
      image: `${config.public.pack}${map.folder}${map.image || 'background.webp'}`,
    }));
  });

  return {
    ...query,
    heroes,
    maps,
  };
};

export const getMap = () => {
  const config = useRuntimeConfig();
  const { map } = storeToRefs(useGameStore());

  const query = useQuery({
    queryKey: ['get-map', unref(map).id],
    queryFn: async () => {
      const data = await useApi()(`${config.public.pack}${map.value?.folder}index.json?v=2`);
      return typeof data === 'string' ? JSON.parse(data) : data;
    },
  });

  watch(
    query.data,
    newMap => {
      if (newMap && Object.keys(newMap)?.length) {
        map.value = { ...newMap, ...map.value };
      }
    },
    { immediate: true },
  );

  return {
    ...query,
  };
};

export const getHeroes = () => {
  const config = useRuntimeConfig();
  const { players } = storeToRefs(useGameStore());
  const { cloneDeep } = useUtils();

  const queries = useQueries({
    queries: players.value.map(hero => ({
      queryKey: ['get-hero', unref(hero).id],
      queryFn: async () => {
        const baseUrl = `${config.public.pack}${hero.folder}`;
        const [heroData, deckData] = await Promise.all([
          useApi()(`${baseUrl}${hero.main}?v=2`),
          useApi()(`${baseUrl}${hero.deck}?v=2`),
        ]);
        return {
          ...heroData,
          cards: deckData,
        };
      },
    })),
  });

  const allLoaded = computed(() => queries.value.every(q => q.isSuccess));

  watch(
    allLoaded,
    ready => {
      if (ready) {
        const fullHeroesData = queries.value.map((q, index) => {
          const apiData = cloneDeep(q.data); 
          return {
            ...apiData,
            ...players.value[index],
          }
        });
        players.value = fullHeroesData;
      }
    },
    { immediate: true },
  );

  const suspense = () => {
    return new Promise(resolve => {
      if (allLoaded.value) {
        return resolve(true);
      }

      const unwatch = watch(
        allLoaded,
        ready => {
          if (ready) {
            unwatch();
            resolve(true);
          }
        },
        { immediate: true },
      );
    });
  };

  return {
    queries,
    suspense,
    allLoaded,
  };
};
