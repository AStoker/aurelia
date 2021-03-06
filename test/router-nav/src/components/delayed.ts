import { customElement } from '@aurelia/runtime-html';
import { wait } from '../utils';

@customElement({
  name: 'delayed',
  template: `A test, just ignore <input>`,
})
export class Delayed {
  public async enter() {
    return wait(5000);
  }
}
