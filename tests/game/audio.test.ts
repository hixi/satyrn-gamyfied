import { describe, expect, test } from 'vitest';
import { SoundBank } from '../../src/game/audio';

describe('sound bank', () => {
  test('starts disabled and plays silently in jsdom', () => {
    const bank = new SoundBank();
    expect(bank.enabled).toBe(false);
    expect(() => {
      bank.click();
      bank.success();
      bank.fail();
      bank.reveal();
      bank.toggleBlip();
    }).not.toThrow();
  });

  test('enabling then playing does not throw without an AudioContext', () => {
    const bank = new SoundBank();
    bank.setEnabled(true);
    expect(bank.enabled).toBe(true);
    expect(() => bank.click()).not.toThrow();
  });
});
