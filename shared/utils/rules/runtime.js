import { isEmpty, OPERATORS } from '../../constants/operators.js';

export const resolveGameContext = async source => {
  if (source?.factValue) return await source.factValue('gameContext');
  return source;
};

export const resolveVarValue = (value, vars = {}) =>
  typeof value === 'string' && value.startsWith('$') ? vars[value] : value;

export const resolveVariables = (params, vars = {}) => {
  if (!params) return {};
  const resolved = { ...params };
  for (const k in resolved) {
    const val = resolved[k];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      resolved[k] = Object.fromEntries(
        Object.entries(val).map(([key, v]) => [key, resolveVarValue(v, vars)]),
      );
    } else {
      resolved[k] = resolveVarValue(val, vars);
    }
  }
  return resolved;
};

export const normalizeOptions = options => {
  if (options == null) return { params: {}, return: undefined, raw: false };
  if (typeof options === 'object' && ('params' in options || 'return' in options || 'raw' in options)) {
    return { params: options.params ?? {}, return: options.return, raw: !!options.raw };
  }
  return { params: options, return: undefined, raw: false };
};

export const resolveOutput = (G, returnKey) => {
  const sel = G.targetSelection;
  if (returnKey && sel?.returnKey === returnKey) {
    const val = G.vars?.[returnKey];
    const pending =
      (sel.kind === 'card' || sel.kind === 'hand' || sel.kind === 'revealed' || sel.kind === 'opponent') &&
      sel.selection === 1
        ? isEmpty(val)
        : (Array.isArray(val) ? val.length : 0) < sel.selection;
    if (pending) {
      G.outputVar = returnKey;
      return { status: 'pending', return: returnKey };
    }
  }
  const val = returnKey ? G.vars?.[returnKey] : undefined;
  const awaitingPrompt =
    returnKey &&
    isEmpty(val) &&
    G.pendingActions?.some(
      a =>
        a.action === 'setVariables' &&
        a.payload?.vars?.some(v => v.var === returnKey),
    );

  if (!returnKey || !isEmpty(val) || !awaitingPrompt) {
    G.outputVar = null;
    return {
      status: 'done',
      value: returnKey ? val : undefined,
      return: returnKey || undefined,
    };
  }

  G.outputVar = returnKey;
  return { status: 'pending', return: returnKey };
};

export const resolveReturn = (explicit, defaultKey) => explicit ?? defaultKey ?? null;

export const applyOperator = (operator, val, expected) => {
  if (operator && OPERATORS[operator]) {
    return OPERATORS[operator](val, expected);
  }
  if (expected !== undefined) return val === expected;
  return true;
};

export const matchCondition = (c, vars) => {
  if (c.fact) return true;
  return applyOperator(c.operator, vars[c.var], c.value);
};

export const matchConditions = (conditions, vars) => {
  if (!conditions) return true;
  const check = c => matchCondition(c, vars);
  if (conditions.all) return conditions.all.every(check);
  if (conditions.or) return conditions.or.some(check);
  return true;
};

export const storeReturn = (G, returnKey, value) => {
  if (!returnKey) return;
  if (!G.vars) G.vars = {};
  G.vars[returnKey] = value;
};

export const setGamePath = (G, path, value) => {
  const key = String(path);
  if (key.startsWith('$')) {
    storeReturn(G, key, value);
    return;
  }
  const parts = key.split('.');
  let obj = G;
  for (let i = 0; i < parts.length - 1; i++) {
    const segment = parts[i];
    if (obj[segment] == null || typeof obj[segment] !== 'object') {
      obj[segment] = {};
    }
    obj = obj[segment];
  }
  obj[parts[parts.length - 1]] = value;
};

export const removeGamePath = (G, path) => {
  const key = String(path);
  if (key.startsWith('$')) {
    if (G.vars) delete G.vars[key];
    return;
  }
  const parts = key.split('.');
  let obj = G;
  for (let i = 0; i < parts.length - 1; i++) {
    if (obj[parts[i]] == null || typeof obj[parts[i]] !== 'object') return;
    obj = obj[parts[i]];
  }
  delete obj[parts[parts.length - 1]];
};
