import { Constructable, IContainer, IResourceKind, ResourceType, PartialResourceDefinition, Key, ResourceDefinition, Injectable } from '@aurelia/kernel';
import { ITargetedInstruction, HooksDefinition } from '../definitions';
import { IDOM, INode, INodeSequence, IRenderLocation } from '../dom';
import { ICustomElementViewModel, ICustomElementController } from '../lifecycle';
import { BindingStrategy } from '../flags';
import { PartialBindableDefinition, BindableDefinition } from '../templating/bindable';
import { PartialChildrenDefinition, ChildrenDefinition } from '../templating/children';
export declare type PartialCustomElementDefinition = PartialResourceDefinition<{
    readonly cache?: '*' | number;
    readonly template?: unknown;
    readonly instructions?: readonly (readonly ITargetedInstruction[])[];
    readonly dependencies?: readonly Key[];
    readonly injectable?: InjectableToken | null;
    readonly needsCompile?: boolean;
    readonly surrogates?: readonly ITargetedInstruction[];
    readonly bindables?: Record<string, PartialBindableDefinition> | readonly string[];
    readonly childrenObservers?: Record<string, PartialChildrenDefinition>;
    readonly containerless?: boolean;
    readonly isStrictBinding?: boolean;
    readonly shadowOptions?: {
        mode: 'open' | 'closed';
    } | null;
    readonly hasSlots?: boolean;
    readonly strategy?: BindingStrategy;
    readonly hooks?: Readonly<HooksDefinition>;
    readonly scopeParts?: readonly string[];
    readonly enhance?: boolean;
}>;
export declare type CustomElementType<C extends Constructable = Constructable, T extends INode = INode> = ResourceType<C, ICustomElementViewModel<T> & (C extends Constructable<infer P> ? P : {}), PartialCustomElementDefinition>;
export declare type CustomElementKind = IResourceKind<CustomElementType, CustomElementDefinition> & {
    /**
     * Returns the closest controller that is associated with either this node (if it is a custom element) or the first
     * parent node (including containerless) that is a custom element.
     *
     * As long as the provided node was directly or indirectly created by Aurelia, this method is guaranteed to return a controller.
     *
     * @param node - The node relative to which to get the closest controller.
     * @param searchParents - Also search the parent nodes (including containerless).
     * @returns The closest controller relative to the provided node.
     * @throws - If neither the node or any of its effective parent nodes host a custom element, an error will be thrown.
     */
    for<T extends INode = INode, C extends ICustomElementViewModel<T> = ICustomElementViewModel<T>>(node: T, opts: {
        searchParents: true;
    }): ICustomElementController<T, C>;
    /**
     * Returns the controller that is associated with this node, if it is a custom element with the provided name.
     *
     * @param node - The node to retrieve the controller for, if it is a custom element with the provided name.
     * @returns The controller associated with the provided node, if it is a custom element with the provided name, or otherwise `undefined`.
     * @throws - If the node does not host a custom element, an error will be thrown.
     */
    for<T extends INode = INode, C extends ICustomElementViewModel<T> = ICustomElementViewModel<T>>(node: T, opts: {
        name: string;
    }): ICustomElementController<T, C> | undefined;
    /**
     * Returns the closest controller that is associated with either this node (if it is a custom element) or the first
     * parent node (including containerless) that is a custom element with the provided name.
     *
     * @param node - The node relative to which to get the closest controller of a custom element with the provided name.
     * @param searchParents - Also search the parent nodes (including containerless).
     * @returns The closest controller of a custom element with the provided name, relative to the provided node, if one can be found, or otherwise `undefined`.
     * @throws - If neither the node or any of its effective parent nodes host a custom element, an error will be thrown.
     */
    for<T extends INode = INode, C extends ICustomElementViewModel<T> = ICustomElementViewModel<T>>(node: T, opts: {
        name: string;
        searchParents: true;
    }): ICustomElementController<T, C> | undefined;
    /**
     * Returns the controller that is associated with this node, if it is a custom element.
     *
     * @param node - The node to retrieve the controller for, if it is a custom element.
     * @param optional - If `true`, do not throw if the provided node is not a custom element.
     * @returns The controller associated with the provided node, if it is a custom element
     * @throws - If the node does not host a custom element, an error will be thrown.
     */
    for<T extends INode = INode, C extends ICustomElementViewModel<T> = ICustomElementViewModel<T>>(node: T): ICustomElementController<T, C>;
    /**
     * Returns the controller that is associated with this node, if it is a custom element.
     *
     * @param node - The node to retrieve the controller for, if it is a custom element.
     * @param optional - If `true`, do not throw if the provided node is not a custom element.
     * @returns The controller associated with the provided node, if it is a custom element, otherwise `null`
     */
    for<T extends INode = INode, C extends ICustomElementViewModel<T> = ICustomElementViewModel<T>>(node: T, opts: {
        optional: true;
    }): ICustomElementController<T, C> | null;
    isType<T extends INode, C>(value: C): value is (C extends Constructable ? CustomElementType<C, T> : never);
    define<T extends INode, C extends Constructable>(name: string, Type: C): CustomElementType<C, T>;
    define<T extends INode, C extends Constructable>(def: PartialCustomElementDefinition, Type: C): CustomElementType<C, T>;
    define<T extends INode, C extends Constructable>(def: PartialCustomElementDefinition, Type?: null): CustomElementType<C, T>;
    define<T extends INode, C extends Constructable>(nameOrDef: string | PartialCustomElementDefinition, Type: C): CustomElementType<C, T>;
    getDefinition<T extends INode, C extends Constructable>(Type: C): CustomElementDefinition<C, T>;
    annotate<K extends keyof PartialCustomElementDefinition>(Type: Constructable, prop: K, value: PartialCustomElementDefinition[K]): void;
    getAnnotation<K extends keyof PartialCustomElementDefinition>(Type: Constructable, prop: K): PartialCustomElementDefinition[K];
    generateName(): string;
    createInjectable<T extends Key = Key>(): InjectableToken<T>;
    generateType<P extends {} = {}>(name: string, proto?: P): CustomElementType<Constructable<P>>;
};
export declare type CustomElementDecorator = <T extends Constructable>(Type: T) => CustomElementType<T>;
/**
 * Decorator: Indicates that the decorated class is a custom element.
 */
export declare function customElement(definition: PartialCustomElementDefinition): CustomElementDecorator;
export declare function customElement(name: string): CustomElementDecorator;
export declare function customElement(nameOrDef: string | PartialCustomElementDefinition): CustomElementDecorator;
declare type ShadowOptions = Pick<PartialCustomElementDefinition, 'shadowOptions'>['shadowOptions'];
/**
 * Decorator: Indicates that the custom element should render its view in ShadowDOM.
 */
export declare function useShadowDOM(options?: ShadowOptions): (target: Constructable) => void;
/**
 * Decorator: Indicates that the custom element should render its view in ShadowDOM.
 */
export declare function useShadowDOM(target: Constructable): void;
/**
 * Decorator: Indicates that the custom element should be rendered without its element container.
 */
export declare function containerless(target: Constructable): void;
/**
 * Decorator: Indicates that the custom element should be rendered without its element container.
 */
export declare function containerless(): (target: Constructable) => void;
/**
 * Decorator: Indicates that the custom element should be rendered with the strict binding option. undefined/null -> 0 or '' based on type
 */
export declare function strict(target: Constructable): void;
/**
 * Decorator: Indicates that the custom element should be rendered with the strict binding option. undefined/null -> 0 or '' based on type
 */
export declare function strict(): (target: Constructable) => void;
export declare class CustomElementDefinition<C extends Constructable = Constructable, T extends INode = INode> implements ResourceDefinition<C, ICustomElementViewModel<T>, PartialCustomElementDefinition> {
    readonly Type: CustomElementType<C, T>;
    readonly name: string;
    readonly aliases: string[];
    readonly key: string;
    readonly cache: '*' | number;
    readonly template: unknown;
    readonly instructions: readonly (readonly ITargetedInstruction[])[];
    readonly dependencies: readonly Key[];
    readonly injectable: InjectableToken<C> | null;
    readonly needsCompile: boolean;
    readonly surrogates: readonly ITargetedInstruction[];
    readonly bindables: Record<string, BindableDefinition>;
    readonly childrenObservers: Record<string, ChildrenDefinition>;
    readonly containerless: boolean;
    readonly isStrictBinding: boolean;
    readonly shadowOptions: {
        mode: 'open' | 'closed';
    } | null;
    readonly hasSlots: boolean;
    readonly strategy: BindingStrategy;
    readonly hooks: Readonly<HooksDefinition>;
    readonly scopeParts: string[];
    readonly enhance: boolean;
    private constructor();
    static create<T extends Constructable = Constructable>(def: PartialCustomElementDefinition, Type?: null): CustomElementDefinition<T>;
    static create<T extends Constructable = Constructable>(name: string, Type: CustomElementType<T>): CustomElementDefinition<T>;
    static create<T extends Constructable = Constructable>(nameOrDef: string | PartialCustomElementDefinition, Type?: CustomElementType<T> | null): CustomElementDefinition<T>;
    static getOrCreate(partialDefinition: PartialCustomElementDefinition): CustomElementDefinition;
    register(container: IContainer): void;
}
export declare type InjectableToken<K = any> = (target: Injectable<K>, property: string, index: number) => void;
export declare const CustomElement: CustomElementKind;
export declare type CustomElementHost<T extends INode = INode> = IRenderLocation<T> & T & {
    $controller?: ICustomElementController<T>;
};
export interface IElementProjector<T extends INode = INode> {
    readonly host: CustomElementHost<T>;
    readonly children: ArrayLike<CustomElementHost<T>>;
    provideEncapsulationSource(): T;
    project(nodes: INodeSequence<T>): void;
    take(nodes: INodeSequence<T>): void;
    subscribeToChildrenChange(callback: () => void, options?: any): void;
}
export declare const IProjectorLocator: import("@aurelia/kernel").InterfaceSymbol<IProjectorLocator<INode>>;
export interface IProjectorLocator<T extends INode = INode> {
    getElementProjector(dom: IDOM<T>, $component: ICustomElementController<T>, host: CustomElementHost<T>, def: CustomElementDefinition): IElementProjector<T>;
}
export {};
//# sourceMappingURL=custom-element.d.ts.map