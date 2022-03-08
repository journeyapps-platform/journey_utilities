/**
 *  Non-String Constant token expression
 */
import { TokenExpression } from './TokenExpression';
import { FormatStringScope } from '../FormatStringScope';

export class PrimitiveConstantTokenExpression extends TokenExpression {
  constructor(expression: any, start?: number) {
    super(expression, start);
    this.isPrimitive = true;
  }

  /**
   * Concatenate a token to current token and return a new token.
   */
  concat(token: PrimitiveConstantTokenExpression): PrimitiveConstantTokenExpression {
    // start value should be start of first token
    return new PrimitiveConstantTokenExpression(this.expression + token.expression, this.start);
  }

  isConstant() {
    return true;
  }

  /**
   * Get the value of the constant token expression.
   */
  valueOf(): any {
    return this.expression;
  }

  async tokenEvaluatePromise(scope: FormatStringScope): Promise<string> {
    return this.expression;
  }
}
