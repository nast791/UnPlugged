/** Точка старта анимации розыгрыша (rect + клон DOM карты из руки). */
const flyOrigin = shallowRef(null);
const flyClone = shallowRef(null);

export const setCardPlayFlyOrigin = el => {
  if (!import.meta.client || !el?.getBoundingClientRect) return;
  flyOrigin.value = el.getBoundingClientRect();
  flyClone.value = el.cloneNode(true);
};

export const clearCardPlayFlyOrigin = () => {
  flyOrigin.value = null;
  flyClone.value = null;
};

export const useCardPlayAnimation = () => ({
  flyOrigin: readonly(flyOrigin),
  flyClone: readonly(flyClone),
  setCardPlayFlyOrigin,
  clearCardPlayFlyOrigin,
});

const FLY_MS = 520;

const mountGhost = (node, rect) => {
  node.style.position = 'fixed';
  node.style.left = `${rect.left}px`;
  node.style.top = `${rect.top}px`;
  node.style.width = `${rect.width}px`;
  node.style.height = `${rect.height}px`;
  node.style.margin = '0';
  node.style.zIndex = '200';
  node.style.pointerEvents = 'none';
  node.style.transformOrigin = 'center center';
  node.style.transform = 'translate(0, 0) scale(1)';
  node.style.transition = 'none';
  node.style.willChange = 'transform';
  node.setAttribute('aria-hidden', 'true');
  document.body.appendChild(node);
  return node;
};

export const runElementFly = (node, fromRect, toRect, durationMs = FLY_MS) =>
  new Promise(resolve => {
    if (!node || !fromRect || !toRect) {
      resolve(false);
      return;
    }

    const ghost = mountGhost(node, fromRect);
    const scale = toRect.width / fromRect.width;
    const dx = toRect.left + toRect.width / 2 - (fromRect.left + fromRect.width / 2);
    const dy = toRect.top + toRect.height / 2 - (fromRect.top + fromRect.height / 2);

    const finish = () => {
      ghost.remove();
      resolve(true);
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ghost.style.transition = `transform ${durationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`;
        ghost.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
      });
    });

    ghost.addEventListener('transitionend', finish, { once: true });
    setTimeout(finish, durationMs + 80);
  });

export const getViewportCenterRect = (width, height) => {
  const w = width ?? 220;
  const h = height ?? (w * 7) / 5;
  return {
    left: window.innerWidth / 2 - w / 2,
    top: window.innerHeight / 2 - h / 2,
    width: w,
    height: h,
  };
};

export const getAnchorRect = (anchorEl, width, height) => {
  if (!anchorEl?.getBoundingClientRect) return null;
  const box = anchorEl.getBoundingClientRect();
  const w = width ?? 100;
  const h = height ?? (w * 7) / 5;
  return {
    left: box.left,
    top: box.top,
    width: w,
    height: h,
  };
};

export const CENTER_HOLD_MS = 2400;
export const MINI_WIDTH = 96;
