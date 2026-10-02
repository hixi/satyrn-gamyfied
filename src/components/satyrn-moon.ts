import { LitElement, html, css } from 'lit';
import { getContent } from '../content';
import type { Store } from '../store/store';
import type { Achievement } from '../../tools/content/schema';

const KINDS = ['lesson', 'skip', 'depth', 'journey'] as const;
const KIND_LABELS: Record<string, string> = {
  lesson: 'Lessons',
  skip: 'Honest skips',
  depth: 'Engine rooms',
  journey: 'Journey',
};

/** The Moon: your journal, your reflection, and your counterweight. */
export class SatyrnMoon extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    h3 {
      margin-block: 0.9rem 0.3rem;
    }
    ul {
      margin: 0;
      padding-inline-start: 1.2rem;
    }
    textarea {
      inline-size: 100%;
      min-block-size: 6rem;
      font-family: monospace;
      font-size: 0.8rem;
    }
    .controls {
      display: flex;
      gap: 0.5rem;
      margin-block: 0.5rem;
    }
    button {
      font: inherit;
      border: 1px solid var(--satyrn-charcoal, #383330);
      border-radius: 0.4rem;
      padding: 0.35rem 0.7rem;
      background: white;
      cursor: pointer;
    }
    .error {
      color: #8a1f1f;
    }
  `;

  static properties = { store: { attribute: false }, error: { attribute: false } };
  declare store?: Store;
  declare error: string;

  private unsubscribe?: () => void;
  private textarea?: HTMLTextAreaElement;

  constructor() {
    super();
    this.error = '';
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (this.store) this.unsubscribe = this.store.subscribe(() => this.requestUpdate());
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribe?.();
  }

  private value(): string {
    return this.textarea?.value ?? '';
  }

  private doExport(): void {
    if (this.textarea) this.textarea.value = this.store?.export() ?? '';
    this.error = '';
  }

  private doImport(): void {
    try {
      this.store?.import(this.value());
      this.error = '';
    } catch (e) {
      this.error = (e as Error).message;
    }
  }

  private doReset(): void {
    if (typeof confirm === 'function' && !confirm('Erase all progress?')) return;
    this.store?.reset();
    if (this.textarea) this.textarea.value = '';
    this.error = '';
  }

  private renderAchievements(earned: Achievement[]) {
    return KINDS.filter((kind) => earned.some((a) => a.kind === kind)).map(
      (kind) => html`
        <h3>${KIND_LABELS[kind]}</h3>
        <ul>
          ${earned.filter((a) => a.kind === kind).map((a) => html`<li>${a.title} — ${a.description}</li>`)}
        </ul>
      `,
    );
  }

  render() {
    const content = getContent();
    const state = this.store?.getState();
    const visited = (state?.visitedWorlds ?? [])
      .map((id) => content.worlds[id]?.title)
      .filter((title): title is string => !!title);
    const earned = (state?.achievements ?? [])
      .map((id) => content.achievements[id])
      .filter((a): a is Achievement => !!a);
    return html`
      <h2>${content.strings['strings.ui']?.values.journalHeading ?? "The Moon's Memory"}</h2>
      <p>The Moon remembers what you lit, and asks how you could be sure.</p>
      <h3>Places visited</h3>
      ${visited.length ? html`<ul>${visited.map((title) => html`<li>${title}</li>`)}</ul>` : html`<p>None yet.</p>`}
      <h3>&nbsp;</h3>
      ${earned.length ? this.renderAchievements(earned) : html`<p>No achievements yet.</p>`}
      <h3>Bring your journey with you</h3>
      <textarea aria-label="Save data" .ref=${(el: HTMLTextAreaElement) => (this.textarea = el)}></textarea>
      <div class="controls">
        <button type="button" @click=${() => this.doExport()}>Export</button>
        <button type="button" @click=${() => this.doImport()}>Import</button>
        <button type="button" @click=${() => this.doReset()}>Reset</button>
      </div>
      ${this.error ? html`<p class="error" role="alert">${this.error}</p>` : null}
    `;
  }
}

customElements.define('satyrn-moon', SatyrnMoon);