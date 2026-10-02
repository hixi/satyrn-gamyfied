import { describe, it, expect } from 'vitest';
import { html } from 'lit';
import { defineMechanic, registerMechanics, registeredMechanics, registeredMechanicElement } from '../../src/mechanics/registry';
import { MechanicElement } from '../../src/mechanics/context';

class TestMechanic extends MechanicElement {
  static accessibilityDescription = 'A test mechanic with no interaction.';
  renderFallback() {
    return html`<p>Nothing to do here.</p>`;
  }
  render() {
    return this.renderAccessibleShell();
  }
}

defineMechanic('mechanic.test', TestMechanic, 'mechanic-test');
registerMechanics();

describe('mechanic contract', () => {
  it('registers a mechanic and reports it', () => {
    expect(registeredMechanics()).toContain('mechanic.test');
  });

  it('every registered mechanic extends the contract and declares accessibility', () => {
    for (const id of registeredMechanics()) {
      const tag = registeredMechanicElement(id);
      expect(tag).toBeTruthy();
      const Ctor: any = customElements.get(tag!);
      expect(Ctor.prototype).toBeInstanceOf(MechanicElement);
      expect(typeof Ctor.accessibilityDescription).toBe('string');
      expect(Ctor.accessibilityDescription.length).toBeGreaterThan(0);
      expect(typeof Ctor.prototype.renderFallback).toBe('function');
    }
  });

  it('registerMechanics is idempotent', () => {
    const before = registeredMechanics().length;
    registerMechanics();
    expect(registeredMechanics().length).toBe(before);
  });
});