import { html, css, type TemplateResult } from 'lit';
import { MechanicElement } from '../context';

type Source = 'well' | 'pipe';

interface Task {
  id: string;
  label: string;
  need: number;
  sensitive: boolean;
}

const DEFAULT_CAPACITY = 5;
const DEFAULT_TASKS: Task[] = [
  { id: 'drinking', label: 'drinking water', need: 2, sensitive: true },
  { id: 'bathing', label: 'bathing water', need: 2, sensitive: true },
  { id: 'laundry', label: 'laundry', need: 3, sensitive: false },
  { id: 'garden', label: 'watering the garden', need: 5, sensitive: false },
];

function parseScenario(params: unknown): { wellCapacity: number; tasks: Task[] } {
  const raw = (params ?? {}) as { wellCapacity?: unknown; tasks?: unknown };
  const wellCapacity =
    typeof raw.wellCapacity === 'number' && raw.wellCapacity > 0 ? raw.wellCapacity : DEFAULT_CAPACITY;
  const tasks = Array.isArray(raw.tasks)
    ? raw.tasks
        .filter((t): t is Record<string, unknown> => !!t && typeof t === 'object')
        .map((t, i) => ({
          id: typeof t.id === 'string' && t.id ? t.id : `task-${i}`,
          label: typeof t.label === 'string' && t.label ? t.label : `need ${i + 1}`,
          need: typeof t.need === 'number' && t.need > 0 ? t.need : 1,
          sensitive: t.sensitive === true,
        }))
    : [];
  return { wellCapacity, tasks: tasks.length ? tasks : DEFAULT_TASKS };
}

/** The Well and the Pipe: route needs between a private well and a shared pipe. */
export class MechanicWell extends MechanicElement {
  static accessibilityDescription =
    'For each need choose Well or Pipe. Sensitive needs must stay in the well, and the well has a fixed capacity.';

  static styles = css`
    :host {
      display: block;
    }
    ul {
      list-style: none;
      margin: 0.5rem 0;
      padding: 0;
      display: grid;
      gap: 0.4rem;
    }
    li {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.5rem;
      border: 1px solid var(--satyrn-charcoal, #383330);
      border-radius: 0.35rem;
    }
    .label {
      flex: 1;
    }
    .tag {
      font-size: 0.8rem;
      color: var(--satyrn-yellow-dark, #433715);
    }
    .meters {
      font-size: 0.9rem;
    }
    .problems {
      color: #8a1f1f;
    }
    button {
      font: inherit;
      border: 1px solid var(--satyrn-charcoal, #383330);
      border-radius: 0.35rem;
      padding: 0.25rem 0.6rem;
      background: white;
      cursor: pointer;
    }
    button[aria-pressed='true'] {
      background: var(--satyrn-yellow, #e3d678);
    }
  `;

  static properties = {
    tasks: { attribute: false },
    wellCapacity: { attribute: false },
    assignments: { attribute: false },
    lastProblems: { attribute: false },
    completed: { attribute: false },
  };

  declare tasks: Task[];
  declare wellCapacity: number;
  declare assignments: Record<string, Source>;
  declare lastProblems: string[] | null;
  declare completed: boolean;

  constructor() {
    super();
    const scenario = parseScenario(undefined);
    this.tasks = scenario.tasks;
    this.wellCapacity = scenario.wellCapacity;
    this.assignments = {};
    this.lastProblems = null;
    this.completed = false;
  }

  override setContext(context: Parameters<MechanicElement['setContext']>[0]): void {
    const scenario = parseScenario(context.mechanic.params);
    this.tasks = scenario.tasks;
    this.wellCapacity = scenario.wellCapacity;
    this.assignments = {};
    this.lastProblems = null;
    this.completed = false;
    super.setContext(context);
  }

  assign(taskId: string, source: Source): void {
    if (this.completed || !this.tasks.some((t) => t.id === taskId)) return;
    this.assignments = { ...this.assignments, [taskId]: source };
    const correctlyPlaced = this.tasks.filter((t) => t.sensitive && this.assignments[t.id] === 'well').length;
    this.emitProgress(correctlyPlaced / this.tasks.length);
    this.lastProblems = null;
    this.requestUpdate();
  }

  wellUsed(): number {
    return this.tasks.filter((t) => this.assignments[t.id] === 'well').reduce((sum, t) => sum + t.need, 0);
  }

  pipeCost(): number {
    return this.tasks.filter((t) => this.assignments[t.id] === 'pipe').reduce((sum, t) => sum + t.need, 0);
  }

  /** Apply the rules and report every problem by name. */
  check(): { ok: boolean; problems: string[] } {
    const problems: string[] = [];
    for (const task of this.tasks) {
      if (!this.assignments[task.id]) problems.push(`${task.label} is not yet routed`);
    }
    for (const task of this.tasks) {
      if (task.sensitive && this.assignments[task.id] === 'pipe') {
        problems.push(`${task.id} is sensitive and cannot go down the pipe`);
      }
    }
    const used = this.wellUsed();
    if (used > this.wellCapacity) {
      problems.push(`the well is over capacity: ${used} of ${this.wellCapacity}`);
    }
    this.lastProblems = problems;
    if (problems.length === 0 && !this.completed) {
      this.completed = true;
      this.emitEvidence({
        assignments: { ...this.assignments },
        wellUsed: used,
        pipeCost: this.pipeCost(),
        usedFallback: false,
      });
      this.emitComplete();
    }
    this.requestUpdate();
    return { ok: problems.length === 0, problems };
  }

  renderFallback(): TemplateResult {
    return html`<p>Keep sensitive needs in the well; send the rest down the pipe within capacity.</p>`;
  }

  render(): TemplateResult {
    return html`
      <ul>
        ${this.tasks.map(
          (task) => html`
            <li>
              <span class="label">${task.label}</span>
              ${task.sensitive ? html`<span class="tag">private</span>` : null}
              <button
                type="button"
                aria-pressed=${this.assignments[task.id] === 'well' ? 'true' : 'false'}
                @click=${() => this.assign(task.id, 'well')}
              >
                Well
              </button>
              <button
                type="button"
                aria-pressed=${this.assignments[task.id] === 'pipe' ? 'true' : 'false'}
                @click=${() => this.assign(task.id, 'pipe')}
              >
                Pipe
              </button>
            </li>
          `,
        )}
      </ul>
      <p class="meters">
        Well: ${this.wellUsed()} of ${this.wellCapacity} &nbsp;·&nbsp; Pipe cost: ${this.pipeCost()}
      </p>
      <button type="button" @click=${() => this.check()}>Route the day</button>
      ${this.lastProblems?.length
        ? html`<ul class="problems">
            ${this.lastProblems.map((problem) => html`<li>${problem}</li>`)}
          </ul>`
        : null}
      ${this.renderAccessibleShell()}
    `;
  }
}

customElements.define('mechanic-well', MechanicWell);