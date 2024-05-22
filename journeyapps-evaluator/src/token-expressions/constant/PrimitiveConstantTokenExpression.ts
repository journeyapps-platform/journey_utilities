/**
 *  Non-String Constant token expression
 */
import { ConstantTokenExpression } from './ConstantTokenExpression';
import { TokenExpressionOptions } from '../TokenExpression';

export interface PrimitiveConstantTokenExpressionOptions extends TokenExpressionOptions {
  expression: any;
}

export class PrimitiveConstantTokenExpression extends ConstantTokenExpression {
  static TYPE = 'primitive-constant-expression';

  static isInstanceOf(obj: any): obj is PrimitiveConstantTokenExpression {
    return obj?.type === PrimitiveConstantTokenExpression.TYPE;
  }

  constructor(options: PrimitiveConstantTokenExpressionOptions) {
    super({ ...options, isPrimitive: true });
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
}
