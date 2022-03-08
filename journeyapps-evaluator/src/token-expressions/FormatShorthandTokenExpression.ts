/**
 * Shorthand token expression with format specifier.
 */
import { ShorthandTokenExpression } from './ShorthandTokenExpression';
import { TokenExpression } from './TokenExpression';
import { FormatStringScope } from '../FormatStringScope';
import { formatValueAsync } from '../tools';

export class FormatShorthandTokenExpression extends TokenExpression {
  inner: ShorthandTokenExpression;

  constructor(expression: string, format: string, start?: number) {
    // wraps ShorthandTokenExpression with format
    super(expression, start);
    this.inner = new ShorthandTokenExpression(expression, start);
    this.format = format;
  }

  isShorthand() {
    return this.inner.isShorthand();
  }

  toString() {
    return '[object ' + this.constructor.name + ' <' + this.expression + ', ' + this.start + ', ' + this.format + '>]';
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
