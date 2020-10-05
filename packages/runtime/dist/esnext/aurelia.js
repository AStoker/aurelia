import { DI, PLATFORM, Registration, InstanceProvider } from '@aurelia/kernel';
import { IActivator } from './activator';
import { INode } from './dom';
import { ILifecycle, } from './lifecycle';
import { ContinuationTask, IStartTaskManager, LifecycleTask, } from './lifecycle-task';
import { CustomElement } from './resources/custom-element';
import { Controller } from './templating/controller';
import { HooksDefinition } from './definitions';
export class CompositionRoot {
    constructor(config, container, rootProvider, enhance = false) {
        this.config = config;
        rootProvider.prepare(this);
        if (config.host != void 0) {
            if (container.has(INode, false)) {
                this.container = container.createChild();
            }
            else {
                this.container = container;
            }
            Registration.instance(INode, config.host).register(this.container);
            this.host = config.host;
        }
        else if (container.has(INode, true)) {
            this.container = container;
            this.host = container.get(INode);
        }
        else {
            throw new Error(`No host element found.`);
        }
        this.strategy = config.strategy != void 0 ? config.strategy : 1 /* getterSetter */;
        const initializer = this.container.get(IDOMInitializer);
        this.dom = initializer.initialize(config);
        this.lifecycle = this.container.get(ILifecycle);
        this.activator = this.container.get(IActivator);
        const taskManager = this.container.get(IStartTaskManager);
        const beforeCreateTask = taskManager.runBeforeCreate();
        if (enhance) {
            const component = config.component;
            this.enhanceDefinition = CustomElement.getDefinition(CustomElement.isType(component)
                ? CustomElement.define({ ...CustomElement.getDefinition(component), template: this.host, enhance: true }, component)
                : CustomElement.define({ name: (void 0), template: this.host, enhance: true, hooks: new HooksDefinition(component) }));
        }
        if (beforeCreateTask.done) {
            this.task = LifecycleTask.done;
            this.create();
        }
        else {
            this.task = new ContinuationTask(beforeCreateTask, this.create, this);
        }
    }
    activate(antecedent) {
        const { task, host, viewModel, container, activator, strategy } = this;
        const flags = strategy;
        if (viewModel === void 0) {
            if (this.createTask === void 0) {
                this.createTask = new ContinuationTask(task, this.activate, this, antecedent);
            }
            return this.createTask;
        }
        if (task.done) {
            if (antecedent == void 0 || antecedent.done) {
                this.task = activator.activate(host, viewModel, container, flags, void 0);
            }
            else {
                this.task = new ContinuationTask(antecedent, activator.activate, activator, host, viewModel, container, flags, void 0);
            }
        }
        else {
            if (antecedent == void 0 || antecedent.done) {
                this.task = new ContinuationTask(task, activator.activate, activator, host, viewModel, container, flags, void 0);
            }
            else {
                const combinedAntecedent = new ContinuationTask(task, antecedent.wait, antecedent);
                this.task = new ContinuationTask(combinedAntecedent, activator.activate, activator, host, viewModel, container, flags, void 0);
            }
        }
        return this.task;
    }
    deactivate(antecedent) {
        const { task, viewModel, activator, strategy } = this;
        const flags = strategy;
        if (viewModel === void 0) {
            if (this.createTask === void 0) {
                this.createTask = new ContinuationTask(task, this.deactivate, this, antecedent);
            }
            return this.createTask;
        }
        if (task.done) {
            if (antecedent == void 0 || antecedent.done) {
                this.task = activator.deactivate(viewModel, flags);
            }
            else {
                this.task = new ContinuationTask(antecedent, activator.deactivate, activator, viewModel, flags);
            }
        }
        else {
            if (antecedent == void 0 || antecedent.done) {
                this.task = new ContinuationTask(task, activator.deactivate, activator, viewModel, flags);
            }
            else {
                const combinedAntecedent = new ContinuationTask(task, antecedent.wait, antecedent);
                this.task = new ContinuationTask(combinedAntecedent, activator.deactivate, activator, viewModel, flags);
            }
        }
        return this.task;
    }
    dispose() {
        var _a;
        (_a = this.controller) === null || _a === void 0 ? void 0 : _a.dispose();
    }
    create() {
        const config = this.config;
        const instance = this.viewModel = CustomElement.isType(config.component)
            ? this.container.get(config.component)
            : config.component;
        const container = this.container;
        const lifecycle = container.get(ILifecycle);
        const taskManager = container.get(IStartTaskManager);
        taskManager.enqueueBeforeCompileChildren();
        // This hack with delayed hydration is to make the controller instance accessible to the `beforeCompileChildren` hook via the composition root.
        this.controller = Controller.forCustomElement(instance, lifecycle, this.host, container, null, this.strategy, false, this.enhanceDefinition);
        this.controller['hydrateCustomElement'](container, null);
    }
}
export class Aurelia {
    constructor(container = DI.createContainer()) {
        if (container.has(Aurelia, true)) {
            throw new Error('An instance of Aurelia is already registered with the container or an ancestor of it.');
        }
        this.container = container;
        this.task = LifecycleTask.done;
        this._isRunning = false;
        this._isStarting = false;
        this._isStopping = false;
        this._root = void 0;
        this.next = (void 0);
        Registration.instance(Aurelia, this).register(container);
        container.registerResolver(CompositionRoot, this.rootProvider = new InstanceProvider());
    }
    get isRunning() {
        return this._isRunning;
    }
    get isStarting() {
        return this._isStarting;
    }
    get isStopping() {
        return this._isStopping;
    }
    get root() {
        if (this._root == void 0) {
            if (this.next == void 0) {
                throw new Error(`root is not defined`); // TODO: create error code
            }
            return this.next;
        }
        return this._root;
    }
    register(...params) {
        this.container.register(...params);
        return this;
    }
    app(config) {
        return this.configureRoot(config);
    }
    enhance(config) {
        return this.configureRoot(config, true);
    }
    start(root = this.next) {
        if (root == void 0) {
            throw new Error(`There is no composition root`); // TODO: create error code
        }
        this.stop(root);
        if (this.task.done) {
            this.onBeforeStart(root);
        }
        else {
            this.task = new ContinuationTask(this.task, this.onBeforeStart, this, root);
        }
        this.task = this.root.activate(this.task);
        if (this.task.done) {
            this.task = this.onAfterStart(root);
        }
        else {
            this.task = new ContinuationTask(this.task, this.onAfterStart, this, root);
        }
        return this.task;
    }
    stop(root = this._root) {
        if (this._isRunning && root != void 0) {
            if (this.task.done) {
                this.onBeforeStop(root);
            }
            else {
                this.task = new ContinuationTask(this.task, this.onBeforeStop, this, root);
            }
            this.task = root.deactivate(this.task);
            if (this.task.done) {
                this.task = this.onAfterStop(root);
            }
            else {
                this.task = new ContinuationTask(this.task, this.onAfterStop, this, root);
            }
        }
        return this.task;
    }
    wait() {
        return this.task.wait();
    }
    dispose() {
        var _a;
        if (this._isRunning || this._isStopping) {
            throw new Error(`The aurelia instance must be fully stopped before it can be disposed`);
        }
        (_a = this._root) === null || _a === void 0 ? void 0 : _a.dispose();
        this._root = void 0;
        this.container.dispose();
    }
    configureRoot(config, enhance) {
        this.next = new CompositionRoot(config, this.container, this.rootProvider, enhance);
        if (this.isRunning) {
            this.start();
        }
        return this;
    }
    onBeforeStart(root) {
        Reflect.set(root.host, '$aurelia', this);
        this.rootProvider.prepare(this._root = root);
        this._isStarting = true;
    }
    onAfterStart(root) {
        this._isRunning = true;
        this._isStarting = false;
        this.dispatchEvent(root, 'aurelia-composed', root.dom);
        this.dispatchEvent(root, 'au-started', root.host);
        return LifecycleTask.done;
    }
    onBeforeStop(root) {
        this._isRunning = false;
        this._isStopping = true;
    }
    onAfterStop(root) {
        Reflect.deleteProperty(root.host, '$aurelia');
        this._root = void 0;
        this.rootProvider.dispose();
        this._isStopping = false;
        this.dispatchEvent(root, 'au-stopped', root.host);
        return LifecycleTask.done;
    }
    dispatchEvent(root, name, target) {
        target = 'dispatchEvent' in target ? target : root.dom;
        target.dispatchEvent(root.dom.createCustomEvent(name, { detail: this, bubbles: true, cancelable: true }));
    }
}
PLATFORM.global.Aurelia = Aurelia;
export const IDOMInitializer = DI.createInterface('IDOMInitializer').noDefault();
//# sourceMappingURL=aurelia.js.map