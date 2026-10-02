import { describe, it, expect } from 'vitest';
import { getContent } from '../../src/content';
import { Store } from '../../src/store/store';
import '../../src/components/satyrn-world';

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

function mount(worldId: string) {
  const store = new Store({ storage: null, achievements: Object.values(getContent().achievements) });
  const world: any = document.createElement('satyrn-world');
  world.worldId = worldId;
  world.store = store;
  world.mode = 'thread';
  document.body.append(world);
  return { world, store };
}

describe('keeper dialogue', () => {
  it('renders the world to its authored dialogue', async () => {
    const { world } = mount('world.rain-gauge-terrace');
    await world.updateComplete;
    const dialogue = world.renderRoot.querySelector('satyrn-dialogue');
    expect(dialogue).toBeTruthy();
    expect(dialogue.dialogueId).toBe('dialogue.waterwarden.intro');
    expect(text(world)).toContain('Every drop costs room');
  });

  it('shows each world its own dialogue', async () => {
    const { world } = mount('world.assayers-scale');
    await world.updateComplete;
    expect(world.renderRoot.querySelector('satyrn-dialogue')?.dialogueId).toBe('dialogue.assayer.intro');
  });

  it('advances the dialogue when a choice is taken', async () => {
    const { world } = mount('world.rain-gauge-terrace');
    await world.updateComplete;
    const dialogue: any = world.renderRoot.querySelector('satyrn-dialogue');
    dialogue.shadowRoot.querySelector('button').click();
    await dialogue.updateComplete;
    expect(text(dialogue)).toContain('It is gone');
  });
});