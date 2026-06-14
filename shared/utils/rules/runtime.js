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
  if (
    returnKey &&
    sel?.returnKey === returnKey &&
    (G.vars?.[returnKey]?.length ?? 0) < sel.selection
  ) {
    G.outputVar = returnKey;
    return { status: 'pending', return: returnKey };
  }
  if (!returnKey || !isEmpty(G.vars?.[returnKey])) {
    G.outputVar = null;
    return {
      status: 'done',
      value: returnKey ? G.vars[returnKey] : undefined,
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
