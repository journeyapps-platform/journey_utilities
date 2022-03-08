/**
 * Shorthand token expression.
 */
import { TokenExpression } from './TokenExpression';
import { FormatStringScope } from '../FormatStringScope';
import { formatValueAsync } from '../tools';

export class ShorthandTokenExpression extends TokenExpression {
  constructor(expression: string, start?: number) {
    super(expression, start);
  }

  isShorthand() {
    return true;
  }

  async tokenEvaluatePromise(scope: FormatStringScope) {
    let expression = this.expression;
    if (expression.length > 0 && expression[0] == '?') {
      expression = expression.substring(1);
    }
    const value = await scope.getValuePromise(expression);
    const type = scope.getExpressionType(expression);
    return formatValueAsync(value, type, this.format);
  }
}
