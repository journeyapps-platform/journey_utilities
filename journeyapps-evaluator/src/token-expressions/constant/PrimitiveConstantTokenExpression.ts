/**
 *  Non-String Constant token expression
 */
import { ConstantTokenExpression } from './ConstantTokenExpression';
import { TokenExpressionOptions } from '../TokenExpression';

export class PrimitiveConstantTokenExpression extends ConstantTokenExpression {
  constructor(expression: any, options?: TokenExpressionOptions) {
    super(expression, { ...options, isPrimitive: true });
  }

  /**
   * Get the value of the constant token expression.
   */
  valueOf(): any {
    return this.expression;
  }
}
