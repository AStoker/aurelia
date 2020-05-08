import { IContainer, IRegistry, IResolver } from '@aurelia/kernel';
import { IDOM, IDOMInitializer, ISinglePageApp } from '@aurelia/runtime';
declare class JSDOMInitializer implements IDOMInitializer {
    private readonly container;
    private readonly jsdom;
    constructor(container: IContainer);
    static register(container: IContainer): IResolver<IDOMInitializer>;
    initialize(config?: ISinglePageApp<Node>): IDOM;
}
export declare const IDOMInitializerRegistration: IRegistry;
/**
 * Default HTML-specific, jsdom-specific implementations for the following interfaces:
 * - `IDOMInitializer`
 */
export declare const DefaultComponents: IRegistry[];
/**
 * A DI configuration object containing html-specific, jsdom-specific registrations:
 * - `RuntimeHtmlConfiguration` from `@aurelia/runtime-html`
 * - `DefaultComponents`
 */
export declare const RuntimeHtmlJsdomConfiguration: {
    /**
     * Apply this configuration to the provided container.
     */
    register(container: IContainer): IContainer;
    /**
     * Create a new container with this configuration applied to it.
     */
    createContainer(): IContainer;
};
export { JSDOMInitializer, };
//# sourceMappingURL=index.d.ts.map