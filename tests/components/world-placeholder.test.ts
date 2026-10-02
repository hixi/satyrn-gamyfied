import { vi, describe, it, expect } from 'vitest';

vi.mock('../../src/content', () => {
  const content = {
    worlds: {
      'world.orphan': {
        id: 'world.orphan',
        title: 'The Orphan',
        act: 'act1',
        order: 0,
        concepts: [],
        mechanic: 'mechanic.missing',
        summary: 's',
        intro: 'i',
      },
    },
    mechanics: {
      'mechanic.missing': {
        id: 'mechanic.missing',
        element: 'mechanic-missing',
        title: 'Missing',
        description: 'd',
        a11y: 'a',
        params: {},
      },
    },
    characters: {},
    concepts: {},
    achievements: {},
    dialogues: {},
    threads: {},
    strings: {
      'strings.ui': {
        id: 'strings.ui',
        title: 'UI',
        values: {
          notInstalled: 'This mechanic is not installed — you can continue.',
          continueWithoutPlaying: 'Continue without playing',
        },
      },
    },
  };
  return { getContent: () => content, getDiagnostics: () => ({ dangling: [] }) };
});

import '../../src/components/satyrn-world';

describe('world placeholder', () => {
  it('shows a not-installed placeholder when no element is registered', async () => {
    const w: any = document.createElement('satyrn-world');
    w.worldId = 'world.orphan';
    document.body.append(w);
    await w.updateComplete;
    expect(w.shadowRoot.textContent).toMatch(/not installed/i);
    expect(w.shadowRoot.querySelector('[data-continue]')).toBeTruthy();
  });
});