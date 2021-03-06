import {startFPSMonitor, startMemMonitor} from 'perf-monitor';
import * as faker from 'faker';
import { customElement, IteratorBindingInstruction, ICustomElementController, HydrateTemplateController, bindable, BindingStrategy, IPlatform, Subject, createElement, TextBindingInstruction } from '@aurelia/runtime-html';
import './app.scss'; // eslint-disable-line import/no-unassigned-import
import template from './app.html';

startFPSMonitor();
startMemMonitor();

function createItem() {
  return {
    name: faker.name.findName(),
    phone: faker.phone.phoneNumber(),
    country: faker.address.country()
  };
}

@customElement({ name: 'app', template })
export class App {
  public rows: any[];
  public cols: string[];
  public subject: Subject;
  @bindable public keyedStrategy: boolean;
  @bindable public proxyStrategy: boolean;

  public $controller: ICustomElementController;

  public constructor() {
    this.rows = [];
    this.cols = ['name', 'phone', 'country'];
  }

  public created(): void {
    this.$controller.host.textContent = '';
    this.createSubject();
  }

  public create(count: number): void {
    for (let i = 0; i < count; ++i) {
      this.rows.push(createItem());
    }
  }

  public clear(): void {
    this.rows = [];
  }

  private createSubject(): void {
    let strategy: BindingStrategy;
    if (this.proxyStrategy) {
      strategy |= BindingStrategy.proxies;
    }
    const p = this.$controller.context.get(IPlatform);
    this.subject = createElement(
      p,
      'table',
      {
        class: 'table is-fullwidth',
      },
      [
        createElement(p, 'thead', {}, [
          createElement(p, 'tr', {
            $1: new HydrateTemplateController({
              name: '',
              template: '<th><au-m class="au"></au-m> </th>',
              instructions: [[new TextBindingInstruction(`\${col | pascal}`)]],
              strategy
            },
            'repeat',
            [new IteratorBindingInstruction(this.keyedStrategy ? 'col of cols' : 'col of cols', 'items')]
            )
          })
        ]),
        createElement(p, 'tbody', {
          $1: new HydrateTemplateController({
            name: '',
            template: '<tr><au-m class="au"></au-m></tr>',
            instructions: [[new HydrateTemplateController({
              name: '',
              template: '<td><au-m class="au"></au-m> </td>',
              instructions: [[new TextBindingInstruction(`\${row[col]}`)]],
              strategy
            },
            'repeat',
            [new IteratorBindingInstruction(this.keyedStrategy ? 'col of cols' : 'col of cols', 'items')]
            )]]
          },
          'repeat',
          [new IteratorBindingInstruction(this.keyedStrategy ? 'row of rows' : 'row of rows', 'items')]
          )
        })
      ]
    );
  }

  protected keyedModeChanged(): void {
    this.createSubject();
  }

  protected patchModeChanged(): void {
    this.createSubject();
  }

  protected proxyModeChanged(): void {
    this.createSubject();
  }
}
