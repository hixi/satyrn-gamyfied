import { describe, it, expect } from 'vitest';
import { Store } from '../../src/store/store';
import { getContent } from '../../src/content';
import '../../src/components/satyrn-moon';
import '../../src/components/satyrn-companion';

const text = (node: Node): string => {
  if (node.nodeType === 3) return node.textContent ?? '';
  if (node.nodeType !== 1) return '';
  const el = node as Element & { shadowRoot?: ShadowRoot | null };
  if (el.tagName === 'STYLE' || el.tagName === 'SCRIPT') return '';
  const children = el.shadowRoot ? Array.from(el.shadowRoot.childNodes) : Array.from(el.childNodes);
  let out = '';
  for (const child of children) out += text(child);
  return out;
};

describe('moon journal', () => {
  it('lists earned achievements by title', async () => {
    const store = new Store({ storage: null, achievements: Object.values(getContent().achievements) });
    store.dispatch({ type: 'mechanic.completed', mechanic: 'mechanic.lantern', world: 'world.lantern-room' });
    const m: any = document.createElement('satyrn-moon');
    m.store = store;
    document.body.append(m);
    await m.updateComplete;
    expect(text(m)).toContain(getContent().achievements['achievement.first-light'].title);
  });

  it('offers export, import, and reset', async () => {
    const m: any = document.createElement('satyrn-moon');
    m.store = new Store({ storage: null });
    document.body.append(m);
    await m.updateComplete;
    expect(text(m)).toMatch(/export/i);
    expect(text(m)).toMatch(/import/i);
    expect(text(m)).toMatch(/reset/i);
  });

  it('names the companion and shows its line', async () => {
    const c: any = document.createElement('satyrn-companion');
    c.line = 'I can only see what you light.';
    document.body.append(c);
    await c.updateComplete;
    expect(text(c)).toContain('Satyrn');
    expect(text(c)).toContain('I can only see what you light.');
  });
});