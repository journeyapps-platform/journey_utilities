/**
 * Legacy function token expression.
 */
import { TokenExpression } from './TokenExpression';
import { ConstantTokenExpression } from './ConstantTokenExpression';
import { FormatStringScope } from '../scope/FormatStringScope';

export class LegacyFunctionTokenExpression extends TokenExpression {
  constructor(expression: string, start?: number) {
    super(expression, start);
  }

  isFunction() {
    return true;
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
    return new ConstantTokenExpression(constantExpression, this.start);
  }

  tokenEvaluatePromise(scope: FormatStringScope): Promise<string> {
    throw new Error('not implemented');
  }
}
