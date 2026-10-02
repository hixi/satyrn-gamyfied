import { describe, it, expect } from 'vitest';
import { getContent } from '../../src/content';
import { SCENARIO_VALIDATORS } from '../../src/mechanics/scenarios';
import { validateScenarios } from '../../tools/content/scenarios';
import type { Content } from '../../tools/content/schema';

describe('scenario validators', () => {
  it('has a validator for every content mechanic that carries params', () => {
    for (const mechanic of Object.values(getContent().mechanics)) {
      if (Object.keys(mechanic.params).length > 0) {
        expect(SCENARIO_VALIDATORS[mechanic.id], mechanic.id).toBeTypeOf('function');
      }
    }
  });

  it('accepts every authored scenario', () => {
    for (const mechanic of Object.values(getContent().mechanics)) {
      const validator = SCENARIO_VALIDATORS[mechanic.id];
      if (validator) expect(validator(mechanic.params), mechanic.id).toEqual([]);
    }
  });

  it('accepts the defaults when params are absent', () => {
    for (const [id, validator] of Object.entries(SCENARIO_VALIDATORS)) {
      expect(validator({}), id).toEqual([]);
    }
  });

  it('reports a mechanic that carries params but has no validator', () => {
    const content = getContent();
    const withFake: Content = {
      ...content,
      mechanics: {
        ...content.mechanics,
        'mechanic.fake': {
          id: 'mechanic.fake',
          element: 'mechanic-fake',
          title: 'Fake',
          description: 'd',
          a11y: 'a',
          params: { anything: 1 },
        },
      },
    };
    expect(validateScenarios(withFake)).toContainEqual({
      mechanic: 'mechanic.fake',
      problem: 'has params but no scenario validator',
    });
  });
});

describe('scenario validators reject unsolvable content', () => {
  it('rain-gauge: essentials exceed the cup', () => {
    const problems = SCENARIO_VALIDATORS['mechanic.rain-gauge']({
      capacity: 1,
      drops: [{ id: 'a', essential: true }, { id: 'b', essential: true }],
    });
    expect(problems.some((p) => /unsolvable/.test(p))).toBe(true);
  });

  it('aviary: no way to lend every errand a suited bird', () => {
    const problems = SCENARIO_VALIDATORS['mechanic.aviary']({
      birds: [{ id: 'wren', name: 'wren', traits: ['swift'] }],
      tasks: [{ id: 't', label: 't', needs: ['vast'] }],
    });
    expect(problems.some((p) => /unsolvable/.test(p))).toBe(true);
  });

  it('cartwright: no verify component', () => {
    const problems = SCENARIO_VALIDATORS['mechanic.cartwright']({
      goal: 8,
      components: [{ id: 'w', name: 'w', type: 'work', power: 2 }, { id: 'l', name: 'l', type: 'limit', limit: 12 }],
    });
    expect(problems.some((p) => /verify/.test(p))).toBe(true);
  });

  it('round-path: the block runs past the steps', () => {
    const problems = SCENARIO_VALIDATORS['mechanic.round-path']({
      steps: [{ id: 'a', label: 'a' }, { id: 'b', label: 'b' }],
      cycleStart: 1,
      cycleLength: 5,
    });
    expect(problems.length).toBeGreaterThan(0);
  });

  it('gate: two orders pass, so the puzzle is ambiguous', () => {
    const problems = SCENARIO_VALIDATORS['mechanic.gate-of-orders']({
      travellers: [{ id: 't', label: 't', attributes: ['lantern'], shouldEnter: true }],
      orders: [
        { id: 'o1', text: 'lantern', allow: ['lantern'], deny: [] },
        { id: 'o2', text: 'everyone', allow: [], deny: [] },
      ],
    });
    expect(problems.some((p) => /ambiguous/.test(p))).toBe(true);
  });

  it('assayer: every weight is sound, so there is nothing to find', () => {
    const problems = SCENARIO_VALIDATORS['mechanic.assayers-scale']({
      items: [{ id: 'a', label: 'a', sound: true }],
      checks: [{ id: 'honest', label: 'assay', kind: 'honest' }],
    });
    expect(problems.some((p) => /nothing to find/.test(p))).toBe(true);
  });

  it('blueprint: no clause matches the drawing', () => {
    const problems = SCENARIO_VALIDATORS['mechanic.blueprint']({
      blueprint: { width: 60, height: 20 },
      clauses: [{ id: 'w', text: '40 wide', kind: 'width', value: 40 }, { id: 'h', text: '20 high', kind: 'height', value: 20 }],
    });
    expect(problems.some((p) => /width clause/.test(p))).toBe(true);
  });

  it('well: sensitive needs exceed the well', () => {
    const problems = SCENARIO_VALIDATORS['mechanic.well-and-pipe']({
      wellCapacity: 1,
      tasks: [{ id: 't', label: 't', need: 2, sensitive: true }],
    });
    expect(problems.some((p) => /unsolvable/.test(p))).toBe(true);
  });

  it('garden: no seeds to plant', () => {
    const problems = SCENARIO_VALIDATORS['mechanic.commons-garden']({
      seeds: [],
      communityBeads: [{ id: 'b', name: 'B', keeper: 'k', about: 'a' }],
    });
    expect(problems.some((p) => /no seeds/.test(p))).toBe(true);
  });
});