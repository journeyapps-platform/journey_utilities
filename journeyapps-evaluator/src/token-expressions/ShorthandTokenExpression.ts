import { FormatStringScope } from '../definitions/FormatStringScope';
import { TypeInterface } from '../definitions/TypeInterface';
import { formatValue } from '../tools';
import { TokenExpression } from './TokenExpression';

/**
 * Shorthand token expression.
 */
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

export async function formatValueAsync(value: any, type: TypeInterface, format: string): Promise<string> {
  if (value != null && typeof value._display == 'function') {
    // Object - recursive promise-based formatting.
    return value._display() as Promise<string>;
  } else {
    return formatValue(value, type, format);
  }
}
