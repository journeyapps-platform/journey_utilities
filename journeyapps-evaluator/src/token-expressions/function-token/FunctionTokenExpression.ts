import { TokenExpression } from '../TokenExpression';
import { ConstantTokenExpression } from '../ConstantTokenExpression';
import { FormatStringScope } from '../../definitions/FormatStringScope';

export class FunctionTokenExpression extends TokenExpression {
  /**
   * Prefix for function token expressions.
   */
  static PREFIX = '$:';

  constructor(expression: string, start?: number) {
    // remove indicator prefix from expression
    const prefix = FunctionTokenExpression.PREFIX;
    let processedExpression = expression.trim();
    if (processedExpression.indexOf(prefix) === 0) {
      processedExpression = processedExpression.slice(prefix.length);
    }

    super(processedExpression, start);
  }

  isFunction() {
    return true;
  }

  /**
   * Name of function represented by function token expression.
   */
  functionName(): string {
    return this.expression.slice(0, this.expression.indexOf('('));
  }

  /**
   * Generate a constant token expression from function token expression.
   * @param {boolean} [includeEscapeTags] if "{" and "}" format string escape tags should be included or not
   */
  toConstant(includeEscapeTags: boolean = false): ConstantTokenExpression {
    let constantExpression = FunctionTokenExpression.PREFIX + this.expression;
    if (includeEscapeTags) {
      constantExpression = '{' + constantExpression + '}';
    }
    return new ConstantTokenExpression(constantExpression, this.start);
  }

  async tokenEvaluatePromise(scope: FormatStringScope): Promise<string> {
    const value = await scope.evaluateFunctionExpression(this.expression);
    // FIXME: FunctionTokenExpression is not only used for FormatStrings, but
    // also for other attributes, e.g. show-if. For those cases, we need the
    // original value, not a string, so we can't convert to a string here.
    return value;
  }

  stringify() {
    return `${FunctionTokenExpression.PREFIX}${this.expression}`;
  }
}
