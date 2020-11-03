import {
  IServiceLocator,
  ITask,
  QueueTaskOptions,
  TaskQueue,
} from '@aurelia/kernel';
import {
  AccessorOrObserver,
  IBindingTargetObserver,
  AccessorType,
  INodeAccessor,
  BindingMode,
  ILifecycle,
  LifecycleFlags,
} from '../observation.js';
import { IObserverLocator } from '../observation/observer-locator.js';
import {
  ExpressionKind,
  ForOfStatement,
  IsBindingBehavior,
} from './ast.js';
import {
  connectable,
  IConnectableBinding,
  IPartialConnectableBinding,
} from './connectable.js';

import type { Scope } from '../observation/binding-context.js';

// BindingMode is not a const enum (and therefore not inlined), so assigning them to a variable to save a member accessor is a minor perf tweak
const { oneTime, toView, fromView } = BindingMode;

// pre-combining flags for bitwise checks is a minor perf tweak
const toViewOrOneTime = toView | oneTime;

export interface PropertyBinding extends IConnectableBinding {}

const updateTaskOpts: QueueTaskOptions = {
  reusable: false,
  preempt: true,
};

@connectable()
export class PropertyBinding implements IPartialConnectableBinding {
  public interceptor: this = this;

  public id!: number;
  public isBound: boolean = false;
  public $lifecycle: ILifecycle;
  public $scope?: Scope = void 0;
  public $hostScope: Scope | null = null;

  public targetObserver?: AccessorOrObserver = void 0;

  public persistentFlags: LifecycleFlags = LifecycleFlags.none;

  private task: ITask | null = null;

  public constructor(
    public sourceExpression: IsBindingBehavior | ForOfStatement,
    public target: object,
    public targetProperty: string,
    public mode: BindingMode,
    public observerLocator: IObserverLocator,
    public locator: IServiceLocator,
    private readonly taskQueue: TaskQueue,
  ) {
    connectable.assignIdTo(this);
    this.$lifecycle = locator.get(ILifecycle);
  }

  public updateTarget(value: unknown, flags: LifecycleFlags): void {
    flags |= this.persistentFlags;
    this.targetObserver!.setValue(value, flags, this.target, this.targetProperty);
  }

  public updateSource(value: unknown, flags: LifecycleFlags): void {
    flags |= this.persistentFlags;
    this.sourceExpression.assign!(flags, this.$scope!, this.$hostScope, this.locator, value);
  }

  public handleChange(newValue: unknown, _previousValue: unknown, flags: LifecycleFlags): void {
    if (!this.isBound) {
      return;
    }

    flags |= this.persistentFlags;

    const targetObserver = this.targetObserver!;
    const interceptor = this.interceptor;
    const sourceExpression = this.sourceExpression;
    const $scope = this.$scope;
    const locator = this.locator;

    if ((flags & LifecycleFlags.updateTarget) > 0) {
      // Alpha: during bind a simple strategy for bind is always flush immediately
      // todo:
      //  (1). determine whether this should be the behavior
      //  (2). if not, then fix tests to reflect the changes/platform to properly yield all with aurelia.start()
      const shouldQueueFlush = (flags & LifecycleFlags.fromBind) === 0 && (targetObserver.type & AccessorType.Layout) > 0;
      const oldValue = targetObserver.getValue(this.target, this.targetProperty);

      // if the only observable is an AccessScope then we can assume the passed-in newValue is the correct and latest value
      if (sourceExpression.$kind !== ExpressionKind.AccessScope || this.observerSlots > 1) {
        // todo: in VC expressions, from view also requires connect
        const shouldConnect = this.mode > oneTime;
        if (shouldConnect) {
          this.version++;
        }
        newValue = sourceExpression.evaluate(flags, $scope!, this.$hostScope, locator, interceptor);
        if (shouldConnect) {
          interceptor.unobserve(false);
        }
      }

      // todo(fred): maybe let the obsrever decides whether it updates
      if (newValue !== oldValue) {
        if (shouldQueueFlush) {
          flags |= LifecycleFlags.noTargetObserverQueue;
          this.task?.cancel();
          this.task = this.taskQueue.queueTask(() => {
            (targetObserver as Partial<INodeAccessor>).flushChanges?.(flags);
            this.task = null;
          }, updateTaskOpts);
        }

        interceptor.updateTarget(newValue, flags);
      }

      return;
    }

    if ((flags & LifecycleFlags.updateSource) > 0) {
      if (newValue !== sourceExpression.evaluate(flags, $scope!, this.$hostScope, locator, null)) {
        interceptor.updateSource(newValue, flags);
      }
      return;
    }

    throw new Error('Unexpected handleChange context in PropertyBinding');
  }

  public $bind(flags: LifecycleFlags, scope: Scope, hostScope: Scope | null): void {
    if (this.isBound) {
      if (this.$scope === scope) {
        return;
      }
      this.interceptor.$unbind(flags | LifecycleFlags.fromBind);
    }
    // Force property binding to always be strict
    flags |= LifecycleFlags.isStrictBindingStrategy;

    // Store flags which we can only receive during $bind and need to pass on
    // to the AST during evaluate/connect/assign
    this.persistentFlags = flags & LifecycleFlags.persistentBindingFlags;

    this.$scope = scope;
    this.$hostScope = hostScope;

    let sourceExpression = this.sourceExpression;
    if (sourceExpression.hasBind) {
      sourceExpression.bind(flags, scope, hostScope, this.interceptor);
    }

    let $mode = this.mode;
    let targetObserver = this.targetObserver as IBindingTargetObserver;
    if (!targetObserver) {
      const observerLocator = this.observerLocator;
      if ($mode & fromView) {
        targetObserver = observerLocator.getObserver(flags, this.target, this.targetProperty) as IBindingTargetObserver;
      } else {
        targetObserver = observerLocator.getAccessor(flags, this.target, this.targetProperty) as IBindingTargetObserver;
      }
      this.targetObserver = targetObserver;
    }
    if ($mode !== BindingMode.oneTime && targetObserver.bind) {
      targetObserver.bind(flags);
    }

    // deepscan-disable-next-line
    $mode = this.mode;

    // during bind, binding behavior might have changed sourceExpression
    sourceExpression = this.sourceExpression;
    const interceptor = this.interceptor;

    const shouldConnect = ($mode & toView) > 0;
    if ($mode & toViewOrOneTime) {
      interceptor.updateTarget(
        sourceExpression.evaluate(flags, scope, this.$hostScope, this.locator, shouldConnect ? interceptor : null),
        flags,
      );
    }
    if ($mode & fromView) {
      targetObserver.subscribe(interceptor);
      if (!shouldConnect) {
        interceptor.updateSource(targetObserver.getValue(this.target, this.targetProperty), flags);
      }
      targetObserver[this.id] |= LifecycleFlags.updateSource;
    }

    // add isBound flag and remove isBinding flag
    this.isBound = true;
  }

  public $unbind(flags: LifecycleFlags): void {
    if (!this.isBound) {
      return;
    }

    // clear persistent flags
    this.persistentFlags = LifecycleFlags.none;

    if (this.sourceExpression.hasUnbind) {
      this.sourceExpression.unbind(flags, this.$scope!, this.$hostScope, this.interceptor);
    }

    this.$scope = void 0;

    const targetObserver = this.targetObserver as IBindingTargetObserver;
    const task = this.task;

    if (targetObserver.unbind) {
      targetObserver.unbind!(flags);
    }
    if (targetObserver.unsubscribe) {
      targetObserver.unsubscribe(this.interceptor);
      targetObserver[this.id] &= ~LifecycleFlags.updateSource;
    }
    if (task != null) {
      task.cancel();
      if (task === targetObserver.task) {
        targetObserver.task = null;
      }
      this.task = null;
    }
    this.interceptor.unobserve(true);

    this.isBound = false;
  }
}
