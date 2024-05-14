/**
 * Shorthand token expression with format specifier.
 */
import { ShorthandTokenExpression } from './ShorthandTokenExpression';

export class FormatShorthandTokenExpression extends ShorthandTokenExpression {
  constructor(expression: string, format: string, start?: number) {
    // wraps ShorthandTokenExpression with format
    super(expression, start);
    this.format = format;
  }

  toString() {
    return '[object ' + this.constructor.name + ' <' + this.expression + ', ' + this.start + ', ' + this.format + '>]';
  }
}
