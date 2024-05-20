import { FormatStringScope } from '../definitions/FormatStringScope';

/**
 * Abstract base token expression class.
 */
export abstract class TokenExpression {
  expression: string;
  start: number | undefined;
  format: string | null;
  isPrimitive: boolean;

  protected constructor(expression: string, start?: number) {
    if (this.constructor === TokenExpression) {
      throw new Error('Cannot instantiate abstract TokenExpression class!');
    }
    this.expression = expression;
    this.start = start;
    this.format = null;
    this.isPrimitive = false;
  }

  abstract tokenEvaluatePromise(scope: FormatStringScope): Promise<string>;

  isConstant(): boolean {
    // not `constant` by default
    return false;
  }

  isShorthand(): boolean {
    // not `shorthand` by default
    return false;
  }

  /**
   * If the token expression is a function that needs to be called or not.
   */
  isFunction(): boolean {
    return false;
  }

  stringify() {
    return this.expression;
  }

  toString(): string {
    return '[object ' + this.constructor.name + ' <' + this.expression + ', ' + this.start + '>]';
  }
}
