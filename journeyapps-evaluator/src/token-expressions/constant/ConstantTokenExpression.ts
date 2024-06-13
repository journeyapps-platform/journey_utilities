/**
 * Constant token expression.
 */
import { TokenExpression, TokenExpressionOptions } from '../TokenExpression';
import { FormatStringScope } from '../../definitions/FormatStringScope';

export class ConstantTokenExpression<
  O extends TokenExpressionOptions = TokenExpressionOptions
> extends TokenExpression<O> {
  static TYPE = 'constant-expression';

  static isInstanceOf(obj: any): obj is ConstantTokenExpression {
    return obj?.type === ConstantTokenExpression.TYPE;
  }

  constructor(options: O) {
    super(ConstantTokenExpression.TYPE, { ...options, isConstant: true });
  }

  /**
   * Concatenate a token to current token and return a new token.
   */
  concat(token: ConstantTokenExpression): ConstantTokenExpression {
    // start value should be start of first token
    return new ConstantTokenExpression({ expression: this.expression.concat(token.expression), start: this.start });
  }

  async tokenEvaluatePromise(scope: FormatStringScope) {
    return this.expression;
  }

  /**
   * Get the value of the constant token expression.
   */
  valueOf(): string {
    return this.expression;
  }

  stringify(): string {
    return `'${this.expression}'`;
  }

  clone(): this {
    return new ConstantTokenExpression(this.options) as this;
  }
}
