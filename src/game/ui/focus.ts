/** Keyboard focus order for one scene: wraps, skips disabled ids. Pure: no Phaser. */

export interface FocusRegistry {
  register(id: string, enabled?: boolean): void;
  unregister(id: string): void;
  setEnabled(id: string, enabled: boolean): void;
  move(dir: 1 | -1): string | null;
  current(): string | null;
}

export function createFocusRegistry(): FocusRegistry {
  const order: string[] = [];
  const enabled = new Map<string, boolean>();
  let index = 0;

  const clamp = () => {
    if (!order.length) return;
    index = ((index % order.length) + order.length) % order.length;
  };

  return {
    register(id, isEnabled = true) {
      if (!order.includes(id)) order.push(id);
      enabled.set(id, isEnabled);
      clamp();
    },
    unregister(id) {
      const at = order.indexOf(id);
      if (at === -1) return;
      order.splice(at, 1);
      enabled.delete(id);
      if (at < index) index -= 1;
      clamp();
    },
    setEnabled(id, isEnabled) {
      if (order.includes(id)) enabled.set(id, isEnabled);
    },
    move(dir) {
      if (!order.length) return null;
      for (let step = 0; step < order.length; step++) {
        index = (index + dir + order.length) % order.length;
        if (enabled.get(order[index]) !== false) return order[index];
      }
      return null;
    },
    current() {
      if (!order.length) return null;
      clamp();
      return order[index];
    },
  };
}
