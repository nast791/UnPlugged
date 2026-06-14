export const isEmpty = val => {
  if (val == null) return true;
  if (Array.isArray(val)) return !val.length;
  if (typeof val === 'string') return !val;
  return false;
};

export const OPERATORS = {
  isEmpty: val => isEmpty(val),
  isNonEmpty: val => !isEmpty(val),
  equal: (val, expected) => val === expected,
  greater: (val, expected) => Number(val) > Number(expected),
};
