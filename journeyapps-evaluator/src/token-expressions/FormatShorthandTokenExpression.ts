/**
 * Shorthand token expression with format specifier.
 */
import { ShorthandTokenExpression } from './ShorthandTokenExpression';
import { TokenExpressionOptions } from './TokenExpression';

export interface FormatShorthandTokenExpressionOptions extends TokenExpressionOptions {
  format: string;
}

/**
 * asset.price:.2f
 */
export class FormatShorthandTokenExpression extends ShorthandTokenExpression<FormatShorthandTokenExpressionOptions> {
  constructor(expression: string, options: FormatShorthandTokenExpressionOptions) {
    // wraps ShorthandTokenExpression with format
    super(expression, options);
  }

  toString() {
    return '[object ' + this.constructor.name + ' <' + this.expression + ', ' + this.start + ', ' + this.format + '>]';
  }
}
