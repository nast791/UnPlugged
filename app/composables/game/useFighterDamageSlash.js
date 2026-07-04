export const DAMAGE_SLASH_MS = 720;
export const DAMAGE_SLASH_PEAK_MS = 360;

/** SVG-путь молнии (viewBox 0 0 40 80). */
export const LIGHTNING_PATH_D = 'M20 2 L12 28 L17 28 L8 54 L26 26 L21 26 L30 2';

/** Точки молнии для Konva (центр фишки = 0,0). */
export const getLightningKonvaPoints = () => [
  0, -32, -10, -4, 4, -4, -14, 20, 14, -16, 4, -16, 18, -34,
];

const LIGHTNING_DASH_LEN = 140;

export { LIGHTNING_DASH_LEN };

const slashes = shallowRef(new Map());
const seenFxIds = new Set();
const slashTick = ref(0);

let rafId = 0;

const startSlashLoop = () => {
  if (rafId) return;
  const loop = () => {
    if (!slashes.value.size) {
      rafId = 0;
      return;
    }
    slashTick.value++;
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);
};

const queueDamageFx = evt => {
  if (!evt?.id || seenFxIds.has(evt.id)) return false;
  seenFxIds.add(evt.id);

  const next = new Map(slashes.value);
  next.set(String(evt.fighterId), {
    fromHp: evt.fromHp,
    toHp: evt.toHp,
    startedAt: performance.now(),
    id: evt.id,
  });
  slashes.value = next;

  setTimeout(() => {
    const updated = new Map(slashes.value);
    if (updated.delete(String(evt.fighterId))) slashes.value = updated;
  }, DAMAGE_SLASH_MS);

  return true;
};

/** Вызывается из subscribe boardgame.io на каждое обновление G. */
export const syncDamageFxFromState = G => {
  if (!import.meta.client || !G?.recentDamage?.length) return;

  let added = false;
  for (const evt of G.recentDamage) {
    if (queueDamageFx(evt)) added = true;
  }
  if (added) startSlashLoop();
};

const getSlashTiming = entry => {
  if (!entry) return null;
  const t = (performance.now() - entry.startedAt) / DAMAGE_SLASH_MS;
  if (t >= 1) return null;
  const draw = Math.min(1, t / 0.42);
  const opacity = t < 0.32 ? t / 0.32 : Math.max(0, 1 - (t - 0.32) / 0.68);
  return { t, draw, opacity };
};

export const useFighterDamageSlash = (fighterId, hpSource) => {
  const id = computed(() => String(toValue(fighterId)));

  const entry = computed(() => slashes.value.get(id.value));
  const slashing = computed(() => !!entry.value);

  const slashOpacity = computed(() => {
    slashTick.value;
    return getSlashTiming(entry.value)?.opacity ?? 0;
  });

  const slashDraw = computed(() => {
    slashTick.value;
    return getSlashTiming(entry.value)?.draw ?? 0;
  });

  const slashDashOffset = computed(() => LIGHTNING_DASH_LEN * (1 - slashDraw.value));

  const displayHp = computed(() => {
    slashTick.value;
    const hp = toValue(hpSource);
    const e = entry.value;
    if (!e) return hp;
    const elapsed = performance.now() - e.startedAt;
    return elapsed < DAMAGE_SLASH_PEAK_MS ? e.fromHp : e.toHp;
  });

  return { slashing, slashOpacity, slashDraw, slashDashOffset, displayHp };
};
