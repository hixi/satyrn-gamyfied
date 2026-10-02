import { LitElement, html, css } from 'lit';
import { getContent } from '../content';

export class SatyrnCompanion extends LitElement {
  static styles = css`
    :host {
      display: block;
      margin-block: 0.75rem;
      padding: 0.6rem 0.85rem;
      border-inline-start: 4px solid var(--satyrn-yellow, #e3d678);
      background: color-mix(in srgb, var(--satyrn-yellow, #e3d678) 12%, white);
    }
    .name {
      font-family: var(--satyrn-font-display, serif);
      margin: 0 0 0.2rem;
    }
  `;

  static properties = { line: {} };
  declare line: string;

  constructor() {
    super();
    this.line = '';
  }

  render() {
    const name = getContent().characters['character.satyrn']?.name ?? 'the Satyrn';
    return html`
      <p class="name">${name}</p>
      <p aria-live="polite">${this.line}</p>
    `;
  }
}

customElements.define('satyrn-companion', SatyrnCompanion);