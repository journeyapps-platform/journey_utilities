/**
 *  Non-String Constant token expression
 */
import { ConstantTokenExpression } from './ConstantTokenExpression';
import { TokenExpressionOptions } from '../TokenExpression';

export interface PrimitiveConstantTokenExpressionOptions extends TokenExpressionOptions {
  expression: any;
  isNullLiteral?: boolean;
}

export class PrimitiveConstantTokenExpression extends ConstantTokenExpression<PrimitiveConstantTokenExpressionOptions> {
  static readonly TYPE = 'primitive-constant-expression';

  static isInstanceOf(obj: any): obj is PrimitiveConstantTokenExpression {
    return obj?.type === PrimitiveConstantTokenExpression.TYPE;
  }

  constructor(options: PrimitiveConstantTokenExpressionOptions) {
    super({ ...options, isPrimitive: true });
  }

  isNullLiteral(): boolean {
    return this.options.isNullLiteral ?? false;
  }

  /**
   * Concatenate a token to current token and return a new token.
   */
  concat(token: ConstantTokenExpression): ConstantTokenExpression {
    // start value should be start of first token
    return new ConstantTokenExpression({
      expression: `${this.expression}`.concat(token.expression),
      start: this.start
    });
  }

  stringify(): string {
    return `${this.expression}`;
  }
}
