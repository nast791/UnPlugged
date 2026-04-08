import { useAppStore } from '~/store/app.js';
import { storeToRefs } from 'pinia';

export default function () {
  const cloneDeep = obj => {
    if (!obj) return {};
    const rawObject = toRaw(obj);
    return structuredClone(rawObject);
  };

  const shuffle = array => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const getNodePosition = (nodeId, nodes) => {
    const node = nodes.find(i => i.id === nodeId || i.id === Number(nodeId));
    if (node) {
      return { x: node.x, y: node.y };
    }
    return { x: 0, y: 0 };
  };

  const getContrastColor = hexColor => {
    if (!hexColor) return '#ffffff';

    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const yiq = (r * 299 + g * 587 + b * 114) / 1000;

    return yiq;
  };

  const sortByTypeAndValue = (deck) => {
    const typeOrder = {
      'strike': 1,
      'hybrid': 2,
      'guard': 3,
      'effect': 4
    };
  
    return [...deck].sort((a, b) => {
      // ПРАВИЛО 1: Сортировка по типу
      if (typeOrder[a.type] !== typeOrder[b.type]) {
        return typeOrder[a.type] - typeOrder[b.type];
      }
  
      // ПРАВИЛО 2: Внутри одного типа — по значению (Value)
      if (a.value !== b.value) {
        return (a.value || 0) - (b.value || 0);
      }
  
      // ПРАВИЛО 3: Если тип и значение одинаковые (дубли), 
      return a.title.localeCompare(b.title);
    });
  };

  return {
    cloneDeep,
    shuffle,
    getNodePosition,
    getContrastColor,
    sortByTypeAndValue
  };
}
