import { describe, it, expect } from 'vitest';
import '../src/app';

describe('scaffold', () => {
  it('defines the satyrn-app element', () => {
    expect(customElements.get('satyrn-app')).toBeTypeOf('function');
  });
});