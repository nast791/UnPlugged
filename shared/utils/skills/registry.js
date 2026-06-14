export const getHookActions = hook => hook.actions ?? hook.event?.params?.actions;

export const getPlayer = (G, playerId) => {
  if (playerId == null || !G?.players?.length) return null;
  const id = String(playerId);
  return G.players[id] ?? G.players.find(p => String(p.id) === id) ?? null;
};

export const getSkillsForPlayer = player => {
  if (!player?.skill) return [];
  return [player.skill];
};

export const getSkillHooks = (G, trigger, playerId) => {
  const player = getPlayer(G, playerId);
  if (!player) return [];
  return getSkillsForPlayer(player).flatMap(skill =>
    (skill.triggers ?? [])
      .filter(h => h.trigger === trigger)
      .map(hook => ({ skill, hook, playerId: String(playerId) })),
  );
};

export const registerPlayerSkill = (player, skill) => {
  if (!skill) return;
  player.skill = skill;
};
