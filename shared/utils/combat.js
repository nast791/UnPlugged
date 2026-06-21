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
