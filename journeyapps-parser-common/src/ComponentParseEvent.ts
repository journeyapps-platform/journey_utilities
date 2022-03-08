import { XMLPositional } from '@journeyapps/core-xml';
import { XMLElement } from '@journeyapps/domparser/types';
import { FormatString, TypeInterface } from '@journeyapps/evaluator';
import { ComponentParserBank } from './ComponentParserBank';

export class ComponentParseEvent<T = object> {
  element: XMLElement;
  component: T;
  rootComponent?: T;
  scope: TypeInterface;
  componentBank: ComponentParserBank;
  helper: {
    inferOnPress(onPress: string): any;
    formatAttribute(
      element: XMLElement,
      value: string,
      scopeType: TypeInterface,
      checkRawTokenExpression?: boolean
    ): FormatString | null;
    formatContent(element: XMLElement, scopeType: TypeInterface): FormatString | null;
    pushError(element: XMLPositional, message: string, type?: string): void;
    parseElement(element: XMLElement, definitions: any): void;
    parseComponent(element: XMLElement, type: TypeInterface): object;
    checkForBooleanToPrimitive(val);
    validateBinding(element: XMLElement, attr: string, allowFunctionBinding: boolean, scopes: TypeInterface): void;
  };

  formatAttribute(key: string, scopeType?: TypeInterface) {
    return this.helper.formatAttribute(this.element, key, scopeType || this.scope, true);
  }

  formatContent(scopeType?: TypeInterface) {
    return this.helper.formatContent(this.element, scopeType || this.scope);
  }

  simpleError(message: string) {
    this.helper.pushError(this.element, message);
  }

  clone(params: any) {
    let event = new ComponentParseEvent<T>();
    event.scope = this.scope;
    event.helper = this.helper;
    event.componentBank = this.componentBank;
    event.element = this.element;
    event.component = this.component;
    event.rootComponent = this.rootComponent;

    for (let key in params) {
      (event as any)[key] = params[key];
    }
    return event;
  }
}
