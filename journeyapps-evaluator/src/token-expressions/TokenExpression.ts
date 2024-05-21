import { FormatStringScope } from '../definitions/FormatStringScope';

export interface TokenExpressionOptions {
  start?: number;
  format?: string;
  isPrimitive?: boolean;
  isConstant?: boolean;
  isShorthand?: boolean;
  /**
   * If the token expression is a function that needs to be called or not.
   */
  isFunction?: boolean;
}

export abstract class TokenExpression<O extends TokenExpressionOptions = TokenExpressionOptions, V extends any = any> {
  expression: string;
  options: O;

  protected constructor(expression: string, options?: O) {
    if (this.constructor === TokenExpression) {
      throw new Error('Cannot instantiate abstract TokenExpression class!');
    }
    this.expression = expression;
    this.options = { isPrimitive: false, isConstant: false, isShorthand: false, isFunction: false, ...options };
  }

  abstract tokenEvaluatePromise(scope: FormatStringScope): Promise<V>;

  get start(): number | null {
    return this.options.start;
  }

  set start(start: number) {
    this.options.start = start;
  }

  get format(): string | null {
    return this.options.format ?? null;
  }

  get isPrimitive(): boolean {
    return this.options.isPrimitive;
  }

  isConstant(): boolean {
    return this.options.isConstant;
  }

  isShorthand(): boolean {
    return this.options.isShorthand;
  }

  isFunction(): boolean {
    return this.options.isFunction;
  }

  stringify() {
    return this.expression;
  }

  toString(): string {
    return '[object ' + this.constructor.name + ' <' + this.expression + ', ' + this.start + '>]';
  }
}
