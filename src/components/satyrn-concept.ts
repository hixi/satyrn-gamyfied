import { LitElement, html, css } from 'lit';
import { getContent } from '../content';

export class SatyrnConcept extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
  `;

  static properties = { conceptId: {} };
  declare conceptId: string;

  constructor() {
    super();
    this.conceptId = '';
  }

  render() {
    const content = getContent();
    const concept = content.concepts[this.conceptId];
    if (!concept) return html`<p>Concept not found: ${this.conceptId}</p>`;
    return html`
      <h2>${concept.term}</h2>
      <p><em>${concept.short}</em></p>
      <p>${concept.body}</p>
      ${concept.related.length
        ? html`<p>
            Related:
            ${concept.related.map((id) => html`<a href="#/concept/${id}">${content.concepts[id]?.term ?? id}</a> `)}
          </p>`
        : null}
      <p><a href="#/">← Back to the Thread</a></p>
    `;
  }
}

customElements.define('satyrn-concept', SatyrnConcept);