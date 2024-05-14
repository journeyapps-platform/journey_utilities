/**
 *  Non-String Constant token expression
 */
import { ConstantTokenExpression } from './ConstantTokenExpression';

export class PrimitiveConstantTokenExpression extends ConstantTokenExpression {
  constructor(expression: any, start?: number) {
    super(expression, start);
    this.isPrimitive = true;
  }

  /**
   * Concatenate a token to current token and return a new token.
   */
  concat(token: ConstantTokenExpression): PrimitiveConstantTokenExpression {
    // start value should be start of first token
    return new PrimitiveConstantTokenExpression(this.expression + token.expression, this.start);
  }
}
