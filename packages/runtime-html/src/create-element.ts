import { Constructable, IContainer, IRegistry, Key } from '@aurelia/kernel';
import {
  HydrateElementInstruction,
  isInstruction,
  SetAttributeInstruction,
  Instruction,
  InstructionType,
} from './instructions';
import { ISyntheticView } from './lifecycle';
import { IPlatform } from './platform';
import { CustomElement, CustomElementDefinition, CustomElementType } from './resources/custom-element';
import { getCompositionContext, ICompositionContext } from './templating/composition-context';
import { IViewFactory } from './templating/view';

export function createElement<C extends Constructable = Constructable>(
  p: IPlatform,
  tagOrType: string | C,
  props?: Record<string, string | Instruction>,
  children?: ArrayLike<unknown>
): CompositionPlan {
  if (typeof tagOrType === 'string') {
    return createElementForTag(p, tagOrType, props, children);
  } else if (CustomElement.isType(tagOrType)) {
    return createElementForType(p, tagOrType, props, children);
  } else {
    throw new Error(`Invalid tagOrType.`);
  }
}

/**
 * CompositionPlan. Todo: describe goal of this class
 */
export class CompositionPlan {
  private lazyDefinition?: CustomElementDefinition = void 0;

  public constructor(
    private readonly node: Node,
    private readonly instructions: Instruction[][],
    private readonly dependencies: Key[]
  ) {}

  public get definition(): CustomElementDefinition {
    if (this.lazyDefinition === void 0) {
      this.lazyDefinition = CustomElementDefinition.create({
        name: CustomElement.generateName(),
        template: this.node,
        needsCompile: typeof this.node === 'string',
        instructions: this.instructions,
        dependencies: this.dependencies,
      });
    }
    return this.lazyDefinition;
  }

  public getContext(parentContainer: IContainer): ICompositionContext {
    return getCompositionContext(this.definition, parentContainer);
  }

  public createView(parentContainer: IContainer): ISyntheticView {
    return this.getViewFactory(parentContainer).create();
  }

  public getViewFactory(parentContainer: IContainer): IViewFactory {
    return this.getContext(parentContainer).getViewFactory();
  }

  /** @internal */
  public mergeInto(parent: Node & ParentNode, instructions: Instruction[][], dependencies: Key[]): void {
    parent.appendChild(this.node);
    instructions.push(...this.instructions);
    dependencies.push(...this.dependencies);
  }
}

function createElementForTag(p: IPlatform, tagName: string, props?: Record<string, string | Instruction>, children?: ArrayLike<unknown>): CompositionPlan {
  const instructions: Instruction[] = [];
  const allInstructions: Instruction[][] = [];
  const dependencies: IRegistry[] = [];
  const element = p.document.createElement(tagName);
  let hasInstructions = false;

  if (props) {
    Object.keys(props)
      .forEach(to => {
        const value = props[to];

        if (isInstruction(value)) {
          hasInstructions = true;
          instructions.push(value);
        } else {
          element.setAttribute(to, value);
        }
      });
  }

  if (hasInstructions) {
    element.className = 'au';
    allInstructions.push(instructions);
  }

  if (children) {
    addChildren(p, element, children, allInstructions, dependencies);
  }

  return new CompositionPlan(element, allInstructions, dependencies);
}

function createElementForType(
  p: IPlatform,
  Type: CustomElementType,
  props?: Record<string, unknown>,
  children?: ArrayLike<unknown>,
): CompositionPlan {
  const definition = CustomElement.getDefinition(Type);
  const tagName = definition.name;
  const instructions: Instruction[] = [];
  const allInstructions = [instructions];
  const dependencies: Key[] = [];
  const childInstructions: Instruction[] = [];
  const bindables = definition.bindables;
  const element = p.document.createElement(tagName);
  element.className = 'au';

  if (!dependencies.includes(Type)) {
    dependencies.push(Type);
  }

  instructions.push(new HydrateElementInstruction(tagName, childInstructions, null));

  if (props) {
    Object.keys(props)
      .forEach(to => {
        const value = props[to] as Instruction | string;

        if (isInstruction(value)) {
          childInstructions.push(value);
        } else {
          const bindable = bindables[to];

          if (bindable !== void 0) {
            childInstructions.push({
              type: InstructionType.setProperty,
              to,
              value
            });
          } else {
            childInstructions.push(new SetAttributeInstruction(value, to));
          }
        }
      });
  }

  if (children) {
    addChildren(p, element, children, allInstructions, dependencies);
  }

  return new CompositionPlan(element, allInstructions, dependencies);
}

function addChildren<T extends HTMLElement>(
  p: IPlatform,
  parent: T,
  children: ArrayLike<unknown>,
  allInstructions: Instruction[][],
  dependencies: Key[],
): void {
  for (let i = 0, ii = children.length; i < ii; ++i) {
    const current = children[i];

    switch (typeof current) {
      case 'string':
        parent.appendChild(p.document.createTextNode(current));
        break;
      case 'object':
        if (current instanceof p.Node) {
          parent.appendChild(current);
        } else if ('mergeInto' in (current as CompositionPlan)) {
          (current as CompositionPlan).mergeInto(parent, allInstructions, dependencies);
        }
    }
  }
}
