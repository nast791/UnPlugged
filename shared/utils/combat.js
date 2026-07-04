import { getHandCardId } from './rules/helpers.js';
import { GAME_PHASES } from '../constants/phases.js';
import { isCardPlayActionPhase } from '../constants/cardPlay.js';

const sidePower = (card, overrideValue, extraBonus) => {
  if (overrideValue != null && Number.isFinite(Number(overrideValue))) {
    return Number(overrideValue);
  }
  if (!card) return 0;
  return Number(card.value ?? 0) + Number(card.bonus ?? 0) + Number(extraBonus ?? 0);
};

/** Нормализует поля боя при входе в фазу атаки/защиты. */
export const ensureCombatDefaults = G => {
  if (!G.combat) return;
  if (G.combat.attackBonus == null) G.combat.attackBonus = 0;
  if (G.combat.defenseBonus == null) G.combat.defenseBonus = 0;
  if (G.combat.attackValue === undefined) G.combat.attackValue = null;
  if (G.combat.defenseValue === undefined) G.combat.defenseValue = null;
};

/** Сила атакующей стороны: attackValue заменяет value+bonus+attackBonus. */
export const getAttackerPower = G =>
  sidePower(G.combat?.card, G.combat?.attackValue, G.combat?.attackBonus);

/** Сила защищающейся стороны: defenseValue заменяет value+bonus+defenseBonus. */
export const getDefenderPower = G =>
  sidePower(
    G.combat?.responseCard ?? G.combat?.defenseCard,
    G.combat?.defenseValue,
    G.combat?.defenseBonus,
  );

/** Записывает итоговые значения в G.combat (вызывается из фазы боя). */
export const resolveCombatPowers = G => {
  if (!G.combat) return;
  ensureCombatDefaults(G);
  G.combat.attackerPower = getAttackerPower(G);
  G.combat.defenderPower = getDefenderPower(G);
  return G.combat;
};

/** Полная карта из руки/сброса; иначе stub из G.combat. */
export const findFullPlayedCard = (G, ownerId, cardRef, stub) => {
  if (!G || cardRef == null) {
    return stub && typeof stub === 'object' ? stub : null;
  }

  const ref = String(cardRef);
  const player = G.players?.find(p => String(p.id) === String(ownerId));

  if (player) {
    for (const zone of ['hand', 'discard']) {
      const found = player[zone]?.find(
        c => getHandCardId(c) === ref || String(c.id) === ref,
      );
      if (found) return found;
    }
  }

  return stub && typeof stub === 'object' ? stub : null;
};

/** Какая карта сейчас разыгрывается (ATTACK / DEFENSE / EFFECT): фаза, карта, владелец. */
export const resolveCardPlayContext = (G, ctx) => {
  if (!G || !ctx) return null;

  const phase = ctx.phase;
  if (!isCardPlayActionPhase(phase)) return null;

  const combat = G.combat;
  const pipeline = G.pipeline;
  const selectedCardId = G.selectedCardId;

  if (phase === GAME_PHASES.EFFECT) {
    if (!selectedCardId || (!combat?.card && !pipeline)) return null;
    const ownerId = ctx.currentPlayer;
    const card = findFullPlayedCard(G, ownerId, selectedCardId, combat?.card);
    return card ? { phase, card, ownerId } : null;
  }

  if (phase === GAME_PHASES.ATTACK) {
    if (!combat?.card && !(pipeline && selectedCardId)) return null;
    const ownerId = combat?.attackerPlayerId ?? ctx.currentPlayer;
    const card = findFullPlayedCard(G, ownerId, combat?.cardId ?? selectedCardId, combat?.card);
    return card ? { phase, card, ownerId } : null;
  }

  if (phase === GAME_PHASES.DEFENSE) {
    const stub = combat?.responseCard ?? combat?.defenseCard;
    const cardRef =
      combat?.defenseCardId ??
      (stub ? (stub.id ?? getHandCardId(stub)) : null) ??
      selectedCardId;

    if (!stub && !cardRef && !(pipeline && selectedCardId)) return null;

    const ownerId =
      combat?.defenderPlayerId ?? combat?.cardPlayerId ?? ctx.currentPlayer;
    const card = findFullPlayedCard(G, ownerId, cardRef, stub);
    return card ? { phase, card, ownerId } : null;
  }

  return null;
};
