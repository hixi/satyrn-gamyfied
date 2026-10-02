import { LitElement, html, css } from 'lit';

export class SatyrnApp extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 1rem;
    }
  `;

  render() {
    return html`<main><h1>Satyrn — The Thread</h1></main>`;
  }
}

customElements.define('satyrn-app', SatyrnApp);