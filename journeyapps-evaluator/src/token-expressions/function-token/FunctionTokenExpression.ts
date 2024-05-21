import { TokenExpression, TokenExpressionOptions } from '../TokenExpression';
import { ConstantTokenExpression } from '../ConstantTokenExpression';
import { FormatStringScope } from '../../definitions/FormatStringScope';

export interface FunctionTokenExpressionOptions extends TokenExpressionOptions {
  name?: string;
  arguments?: TokenExpression[];
}

export class FunctionTokenExpression extends TokenExpression<FunctionTokenExpressionOptions> {
  /**
   * Prefix for function token expressions.
   */
  static PREFIX = '$:';

  constructor(expression: string, options: FunctionTokenExpressionOptions = {}) {
    // remove indicator prefix from expression
    const prefix = FunctionTokenExpression.PREFIX;
    let expr = expression.trim();
    if (expr.indexOf(prefix) === 0) {
      expr = expr.slice(prefix.length);
    }
    options.name = options.name ?? expr.slice(0, expr.indexOf('('));
    options.arguments = options.arguments ?? [];

    super(expr, { ...options, isFunction: true });
  }

  get arguments() {
    return this.options.arguments;
  }

  functionName(): string {
    return this.options.name;
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
    return new ConstantTokenExpression(constantExpression, { start: this.start });
  }

  async tokenEvaluatePromise(scope: FormatStringScope) {
    return scope.evaluateFunctionExpression(this.expression);
  }

  stringify() {
    return `${FunctionTokenExpression.PREFIX}${this.functionName()}(${this.arguments
      .map((arg) => arg.stringify())
      .join(', ')})`;
  }
}
