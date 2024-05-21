/**
 * Legacy function token expression.
 */
import { TokenExpression, TokenExpressionOptions } from '../TokenExpression';
import { ConstantTokenExpression } from '../constant/ConstantTokenExpression';
import { FormatStringScope } from '../../definitions/FormatStringScope';

export class LegacyFunctionTokenExpression extends TokenExpression {
  constructor(expression: string, options?: TokenExpressionOptions) {
    super(expression, { ...options, isFunction: true });
  }

  /**
   * Generate a constant token expression from legacy function token expression.
   * @param {boolean} [includeEscapeTags] if "{" and "}" format string escape tags should be included or not
   */
  toConstant(includeEscapeTags: boolean = false): ConstantTokenExpression {
    let constantExpression = this.expression;
    if (includeEscapeTags) {
      constantExpression = '{' + constantExpression + '}';
    }
    return new ConstantTokenExpression(constantExpression, { start: this.start });
  }

  tokenEvaluatePromise(scope: FormatStringScope): Promise<string> {
    throw new Error('not implemented');
  }
}
