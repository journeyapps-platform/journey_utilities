import { FunctionExpressionContext } from '../../context/FunctionExpressionContext';
import { TokenExpressionParser } from '../../TokenExpressionParser';
import { TokenExpression, TokenExpressionOptions } from '../TokenExpression';
import { ConstantTokenExpression } from '../constant/ConstantTokenExpression';
import { FormatStringScope } from '../../definitions/FormatStringScope';

export interface FunctionTokenExpressionOptions extends TokenExpressionOptions {
  name?: string;
  arguments?: TokenExpression[];
}

export class FunctionTokenExpression extends TokenExpression<FunctionTokenExpressionOptions> {
  static TYPE = 'function-token-expression';

  static isInstanceOf(obj: any): obj is FunctionTokenExpression {
    return obj?.type === FunctionTokenExpression.TYPE;
  }

  /**
   * Prefix for function token expressions.
   */
  static PREFIX = '$:';

  static parse(source: string) {
    return TokenExpressionParser.get().parse<FunctionTokenExpression>({
      source,
      context: new FunctionExpressionContext()
    });
  }

  constructor(options: FunctionTokenExpressionOptions) {
    super(FunctionTokenExpression.TYPE, { ...options, isFunction: true });
    // remove indicator prefix from expression
    this.expression = this.expression.trim();
    if (this.expression.startsWith(FunctionTokenExpression.PREFIX)) {
      this.expression = this.expression.slice(FunctionTokenExpression.PREFIX.length);
    }

    if (!this.options.name) {
      const startBracket = this.expression.indexOf('(');
      this.options.name = this.expression.slice(0, startBracket > 0 ? startBracket : this.expression.length);
    }

    this.options.arguments = this.options.arguments ?? [];
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
    return new ConstantTokenExpression({ expression: constantExpression, start: this.start });
  }

  async tokenEvaluatePromise(scope: FormatStringScope) {
    return scope.evaluateFunctionExpression(this.expression);
  }

  stringify() {
    return `${this.functionName()}(${this.arguments.map((arg) => arg.stringify()).join(', ')})`;
  }
}
