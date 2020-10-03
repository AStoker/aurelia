import { IContainer, IResolver, Key } from '@aurelia/kernel';
import { Aurelia, CustomElementHost, HydrateElementInstruction, HydrateTemplateController, IBindingTargetAccessor, IBindingTargetObserver, IDOM, IDOMInitializer, IElementProjector, IInstructionRenderer, ILifecycle, INode, INodeSequence, INodeSequenceFactory, IObserverLocator, IProjectorLocator, IRenderLocation, IsBindingBehavior, ISinglePageApp, ITargetAccessorLocator, ITargetedInstruction, ITargetObserverLocator, PartialCustomElementDefinition, LetElementInstruction, LifecycleFlags, TargetedInstruction, CustomElementDefinition, IScheduler, ICustomElementController } from '@aurelia/runtime';
export declare class AuNode implements INode {
    readonly nodeName: string;
    readonly isWrapper: boolean;
    readonly isMarker: boolean;
    readonly isRenderLocation: boolean;
    $start: AuNode | null;
    $nodes: INodeSequence<AuNode> | Readonly<{}> | null;
    isTarget: boolean;
    get isConnected(): boolean;
    set isConnected(value: boolean);
    isMounted: boolean;
    parentNode: AuNode | null;
    childNodes: AuNode[];
    get textContent(): string;
    set textContent(value: string);
    nextSibling: AuNode | null;
    previousSibling: AuNode | null;
    firstChild: AuNode | null;
    lastChild: AuNode | null;
    private _isConnected;
    private _textContent;
    constructor(name: string, isWrapper: boolean, isTarget: boolean, isMarker: boolean, isRenderLocation: boolean, isMounted: boolean, isConnected: boolean);
    static createHost(): AuNode;
    static createMarker(): AuNode;
    static createRenderLocation(): AuNode;
    static createText(text?: string): AuNode;
    static createTemplate(): AuNode;
    appendChild(childNode: AuNode): this;
    removeChild(childNode: AuNode): void;
    remove(): void;
    replaceChild(newNode: AuNode, oldNode: AuNode): void;
    insertBefore(newNode: AuNode, refNode: AuNode): void;
    cloneNode(deep?: boolean): AuNode;
    populateTargets(targets: AuNode[]): void;
    makeTarget(): this;
}
export declare class AuDOM implements IDOM<AuNode> {
    createNodeSequence(fragment: AuNode): AuNodeSequence;
    addEventListener(eventName: string, subscriber: unknown, publisher?: unknown, options?: unknown): void;
    appendChild(parent: AuNode, child: AuNode): void;
    cloneNode<T extends INode = AuNode>(node: T, deep?: boolean): T;
    convertToRenderLocation(node: AuNode): IRenderLocation<AuNode> & AuNode;
    createDocumentFragment(nodeOrText?: AuNode | string): AuNode;
    createElement(name: string): AuNode;
    createTemplate(nodeOrText?: AuNode | string): AuNode;
    createTextNode(text: string): AuNode;
    getEffectiveParentNode(node: AuNode): AuNode | null;
    setEffectiveParentNode(child: INodeSequence, parent: AuNode): void;
    setEffectiveParentNode(child: AuNode, parent: AuNode): void;
    insertBefore(nodeToInsert: AuNode, referenceNode: AuNode): void;
    isMarker(node: AuNode): node is AuNode;
    isNodeInstance(node: AuNode): node is AuNode;
    isRenderLocation(node: unknown): node is IRenderLocation<AuNode> & AuNode;
    makeTarget(node: AuNode): void;
    registerElementResolver(container: IContainer, resolver: IResolver): void;
    remove(node: AuNode): void;
    removeEventListener(eventName: string, subscriber: unknown, publisher?: unknown, options?: unknown): void;
    setAttribute(node: AuNode, name: string, value: unknown): void;
    createCustomEvent(eventType: string, options?: unknown): unknown;
    dispatchEvent(evt: unknown): void;
    createNodeObserver?(node: AuNode, cb: (...args: unknown[]) => void, init: unknown): unknown;
}
export declare class AuProjectorLocator implements IProjectorLocator {
    getElementProjector(dom: IDOM, $component: ICustomElementController<AuNode>, host: CustomElementHost<AuNode>, def: CustomElementDefinition): IElementProjector;
}
export declare class AuProjector implements IElementProjector {
    host: CustomElementHost<AuNode>;
    constructor($controller: ICustomElementController<AuNode>, host: CustomElementHost<AuNode>);
    get children(): ArrayLike<CustomElementHost<IRenderLocation<AuNode> & AuNode>>;
    subscribeToChildrenChange(callback: () => void): void;
    provideEncapsulationSource(): AuNode;
    project(nodes: INodeSequence): void;
    take(nodes: INodeSequence): void;
}
export declare class AuNodeSequence implements INodeSequence<AuNode> {
    readonly dom: AuDOM;
    isMounted: boolean;
    isLinked: boolean;
    firstChild: AuNode;
    lastChild: AuNode;
    childNodes: AuNode[];
    next?: INodeSequence<AuNode>;
    private refNode?;
    private readonly wrapper;
    private readonly targets;
    constructor(dom: AuDOM, wrapper: AuNode);
    findTargets(): AuNode[];
    insertBefore(refNode: AuNode): void;
    appendTo(parent: AuNode): void;
    remove(): void;
    addToLinked(): void;
    unlink(): void;
    link(next: INodeSequence<AuNode> | IRenderLocation<AuNode> | undefined): void;
    private obtainRefNode;
}
export declare class AuNodeSequenceFactory implements INodeSequenceFactory<AuNode> {
    private readonly dom;
    private readonly wrapper;
    constructor(dom: AuDOM, node: AuNode);
    createNodeSequence(): AuNodeSequence;
}
export declare class AuDOMInitializer implements IDOMInitializer {
    static readonly inject: readonly Key[];
    private readonly container;
    constructor(container: IContainer);
    initialize(config?: ISinglePageApp<AuNode>): AuDOM;
}
export declare class AuObserverLocator implements ITargetAccessorLocator, ITargetObserverLocator {
    getObserver(flags: LifecycleFlags, scheduler: IScheduler, lifecycle: ILifecycle, observerLocator: IObserverLocator, obj: unknown, propertyName: string): IBindingTargetAccessor | IBindingTargetObserver;
    overridesAccessor(obj: unknown, propertyName: string): boolean;
    getAccessor(flags: LifecycleFlags, scheduler: IScheduler, lifecycle: ILifecycle, obj: unknown, propertyName: string): IBindingTargetAccessor;
    handles(obj: unknown): boolean;
}
export declare class AuTextInstruction implements ITargetedInstruction {
    readonly type: 'au';
    readonly from: IsBindingBehavior;
    constructor(from: IsBindingBehavior);
}
export declare class AuTextRenderer implements IInstructionRenderer {
    private readonly observerLocator;
    constructor(observerLocator: IObserverLocator);
    render(flags: LifecycleFlags, context: IContainer, controller: ICustomElementController<AuNode>, target: AuNode, instruction: AuTextInstruction): void;
}
export declare const AuDOMConfiguration: {
    register(container: IContainer): void;
    createContainer(): IContainer;
};
export declare const AuDOMTest: {
    setup(): {
        au: Aurelia;
        container: IContainer;
        lifecycle: ILifecycle;
        host: AuNode;
    };
    createTextDefinition(expression: string, name?: string): PartialCustomElementDefinition;
    createTemplateControllerDefinition(instruction: HydrateTemplateController, name?: string): PartialCustomElementDefinition;
    createElementDefinition(instructions: TargetedInstruction[][], name: string): PartialCustomElementDefinition;
    createIfInstruction(expression: string, def: PartialCustomElementDefinition): HydrateTemplateController;
    createElseInstruction(def: PartialCustomElementDefinition): HydrateTemplateController;
    createRepeatInstruction(expression: string, def: PartialCustomElementDefinition): HydrateTemplateController;
    createWithInstruction(expression: string, def: PartialCustomElementDefinition): HydrateTemplateController;
    createElementInstruction(name: string, bindings: [string, string][]): HydrateElementInstruction;
    createLetInstruction(bindings: [string, string][], toBindingContext?: boolean): LetElementInstruction;
};
//# sourceMappingURL=au-dom.d.ts.map