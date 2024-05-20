/**
 *  Non-String Constant token expression
 */
import { ConstantTokenExpression } from './ConstantTokenExpression';

export class PrimitiveConstantTokenExpression extends ConstantTokenExpression {
  constructor(expression: any, start?: number) {
    super(expression, start);
    this.isPrimitive = true;
  }
}
