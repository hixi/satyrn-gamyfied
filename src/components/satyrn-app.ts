import { LitElement, html, css } from 'lit';
import { Store } from '../store/store';
import { Router, type Route } from '../router';
import { getContent, getDiagnostics } from '../content';
import './satyrn-map';
import './satyrn-world';
import './satyrn-concept';
import './satyrn-not-found';
import './satyrn-moon';

/** The shell: header, Thread/Wander toggle, route switch, and dev diagnostics. */
export class SatyrnApp extends LitElement {
  static styles = css`
    :host {
      display: block;
      max-inline-size: 52rem;
      margin: 0 auto;
      padding: 1rem 1.25rem 3rem;
    }
    header {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 0.75rem;
      border-block-end: 2px solid var(--satyrn-charcoal, #383330);
      margin-block-end: 1.25rem;
    }
    h1 {
      margin: 0;
      font-size: 1.35rem;
      flex: 1 1 auto;
    }
    .mode button[aria-pressed='true'] {
      background: var(--satyrn-yellow, #e3d678);
    }
    .mode button {
      font: inherit;
      border: 1px solid var(--satyrn-charcoal, #383330);
      background: transparent;
      border-radius: 999px;
      padding: 0.2rem 0.7rem;
      cursor: pointer;
    }
    .diagnostics {
      border: 1px solid var(--satyrn-yellow-ui, #816928);
      background: color-mix(in srgb, var(--satyrn-yellow, #e3d678) 30%, white);
      padding: 0.5rem 0.75rem;
      border-radius: 0.4rem;
      font-size: 0.9rem;
    }
  `;

  static properties = {
    store: { attribute: false },
    router: { attribute: false },
    route: { attribute: false },
  };
  declare store: Store;
  declare router: Router;
  declare route: Route;

  private unsubscribeState?: () => void;
  private unsubscribeRouter?: () => void;

  constructor() {
    super();
    this.route = { name: 'map' };
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (!this.router) this.router = new Router();
    this.router.start();
    this.unsubscribeRouter = this.router.subscribe((route) => {
      this.route = route;
    });
    if (!this.store) this.store = new Store();
    this.unsubscribeState = this.store.subscribe(() => this.requestUpdate());
    this.route = this.router.current();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribeState?.();
    this.unsubscribeRouter?.();
    this.router?.stop();
  }

  /** Single render switch; also the seam tests call directly. */
  renderRoute(route: Route): void {
    this.route = route;
  }

  private setMode(mode: 'thread' | 'wander'): void {
    this.store?.dispatch({ type: 'mode.changed', mode });
  }

  private renderDiagnostics() {
    const dangling = getDiagnostics().dangling;
    if (!dangling.length) return null;
    return html`
      <div class="diagnostics" role="status">
        <strong>Content warning:</strong>
        ${dangling.map((ref) => html`<span>${ref.from} → ${ref.target} (${ref.field}); </span>`)}
      </div>
    `;
  }

  render() {
    const ui = getContent().strings['strings.ui']?.values ?? {};
    const mode = this.store?.getState().mode ?? 'thread';
    return html`
      <header>
        <h1>${ui.appTitle ?? 'Satyrn'}</h1>
        <span class="mode">
          <button type="button" aria-pressed=${mode === 'thread' ? 'true' : 'false'} @click=${() => this.setMode('thread')}>
            ${ui.threadMode ?? 'Thread'}
          </button>
          <button type="button" aria-pressed=${mode === 'wander' ? 'true' : 'false'} @click=${() => this.setMode('wander')}>
            ${ui.wanderMode ?? 'Wander'}
          </button>
        </span>
      </header>
      <details class="journal">
        <summary>Journal</summary>
        <satyrn-moon .store=${this.store}></satyrn-moon>
      </details>
      ${this.renderDiagnostics()}
      <main>${this.renderRouteContent()}</main>
    `;
  }

  private renderRouteContent() {
    switch (this.route.name) {
      case 'map':
      case 'thread':
        return html`<satyrn-map .store=${this.store}></satyrn-map>`;
      case 'world':
        return html`<satyrn-world .worldId=${this.route.worldId} .store=${this.store}></satyrn-world>`;
      case 'concept':
        return html`<satyrn-concept .conceptId=${this.route.conceptId}></satyrn-concept>`;
      case 'journal':
        return html`<satyrn-moon .store=${this.store}></satyrn-moon>`;
      case 'notFound':
        return html`<satyrn-not-found .path=${this.route.path}></satyrn-not-found>`;
    }
  }
}

customElements.define('satyrn-app', SatyrnApp);