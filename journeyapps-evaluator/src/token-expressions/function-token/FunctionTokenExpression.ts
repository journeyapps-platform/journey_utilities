import { TokenExpression } from '../TokenExpression';
import { ConstantTokenExpression } from '../ConstantTokenExpression';
import { FormatStringScope } from '../../definitions/FormatStringScope';

export interface FunctionTokenExpressionOptions {
  name?: string;
  start?: number;
  arguments?: TokenExpression[];
}

export class FunctionTokenExpression extends TokenExpression {
  /**
   * Prefix for function token expressions.
   */
  static PREFIX = '$:';

  private args: TokenExpression[];
  private name: string;

  constructor(expression: string, startOrOptions: number | FunctionTokenExpressionOptions = {}) {
    // remove indicator prefix from expression
    const prefix = FunctionTokenExpression.PREFIX;
    let expr = expression.trim();
    if (expr.indexOf(prefix) === 0) {
      expr = expr.slice(prefix.length);
    }
    const options = typeof startOrOptions === 'number' ? { start: startOrOptions } : startOrOptions;
    super(expr, options.start);

    this.args = options.arguments ?? [];
    this.name = options.name ?? expr.slice(0, expr.indexOf('('));
  }

  isFunction() {
    return true;
  }

  functionName(): string {
    return this.name;
  }

  get arguments() {
    return this.args;
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
    return `${FunctionTokenExpression.PREFIX}${this.functionName()}(${this.arguments
      .map((arg) => arg.stringify())
      .join(', ')})`;
  }
}
