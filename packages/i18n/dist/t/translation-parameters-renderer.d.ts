import { IContainer } from '@aurelia/kernel';
import { BindingMode, BindingType, ICallBindingInstruction, IRenderableController, IExpressionParser, IInstructionRenderer, IObserverLocator, IsBindingBehavior, LifecycleFlags, AttrSyntax, BindingSymbol, BindingCommandInstance, PlainAttributeSymbol } from '@aurelia/runtime';
export declare const TranslationParametersInstructionType = "tpt";
declare const attribute = "t-params.bind";
export declare class TranslationParametersAttributePattern {
    [attribute](rawName: string, rawValue: string, parts: string[]): AttrSyntax;
}
export declare class TranslationParametersBindingInstruction {
    from: IsBindingBehavior;
    to: string;
    readonly type: string;
    mode: BindingMode.toView;
    constructor(from: IsBindingBehavior, to: string);
}
export declare class TranslationParametersBindingCommand implements BindingCommandInstance {
    readonly bindingType: BindingType.BindCommand;
    compile(binding: PlainAttributeSymbol | BindingSymbol): TranslationParametersBindingInstruction;
}
export declare class TranslationParametersBindingRenderer implements IInstructionRenderer {
    private readonly parser;
    private readonly observerLocator;
    constructor(parser: IExpressionParser, observerLocator: IObserverLocator);
    render(flags: LifecycleFlags, context: IContainer, controller: IRenderableController, target: HTMLElement, instruction: ICallBindingInstruction): void;
}
export {};
//# sourceMappingURL=translation-parameters-renderer.d.ts.map