import { useAppStore } from '~/store/app.js';
import { storeToRefs } from 'pinia';

export default function () {
  const { stopScrollingPage } = storeToRefs(useAppStore());

  const toggleStopScrolling = stop => {
    stopScrollingPage.value = stop;
  };

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

  return {
    toggleStopScrolling,
    cloneDeep,
    shuffle,
    getNodePosition,
    getContrastColor,
  };
}
