import { describe, it, expect } from 'vitest';
import { createInitialState } from '../../src/store/state';
import '../../src/components/satyrn-dialogue';
import { getContent } from '../../src/content';

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

describe('dialogue', () => {
  const dialogue = getContent().dialogues['dialogue.satyrn.intro'];

  it('renders the starting node and its choices', async () => {
    const d: any = document.createElement('satyrn-dialogue');
    d.dialogueId = 'dialogue.satyrn.intro';
    d.state = createInitialState();
    document.body.append(d);
    await d.updateComplete;
    expect(text(d)).toContain(dialogue.nodes[dialogue.start].text);
  });

  it('hides a gated choice until the condition is met, then shows it', async () => {
    const gated = Object.values(dialogue.nodes)
      .flatMap((n) => n.choices)
      .find((c) => c.condition);
    expect(gated).toBeDefined();

    const d: any = document.createElement('satyrn-dialogue');
    d.dialogueId = dialogue.id;
    d.state = createInitialState();
    document.body.append(d);
    await d.updateComplete;
    expect(text(d)).not.toContain(gated!.text);

    d.state = { ...createInitialState(), visitedWorlds: ['world.lantern-room'] };
    await d.updateComplete;
    expect(text(d)).toContain(gated!.text);
  });

  it('advances to the next node when a choice is chosen', async () => {
    const d: any = document.createElement('satyrn-dialogue');
    d.dialogueId = dialogue.id;
    d.state = createInitialState();
    document.body.append(d);
    await d.updateComplete;
    const button = d.shadowRoot.querySelector('button');
    button.click();
    await d.updateComplete;
    expect(text(d)).toContain(dialogue.nodes.answer.text);
  });
});