import { LitElement, html, css } from 'lit';

export class SatyrnNotFound extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
  `;

  static properties = { path: {} };
  declare path: string;

  constructor() {
    super();
    this.path = '';
  }

  render() {
    return html`
      <h2>Not found</h2>
      <p>There is nothing on the Thread at <code>${this.path}</code>.</p>
      <p><a href="#/">← Back to the Thread</a></p>
    `;
  }
}

customElements.define('satyrn-not-found', SatyrnNotFound);