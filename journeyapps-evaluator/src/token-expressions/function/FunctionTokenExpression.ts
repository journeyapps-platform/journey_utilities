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
    this.expression = FunctionTokenExpression.trimPrefix(this.expression);

    if (!this.options.name) {
      const startBracket = this.expression.indexOf('(');
      this.setFunctionName(this.expression.slice(0, startBracket > 0 ? startBracket : this.expression.length));
    }
  }

  get arguments(): TokenExpression[] | null {
    return this.options.arguments;
  }

  functionName(): string {
    return this.options.name;
  }

  setFunctionName(name: string) {
    this.options.name = name;
  }

  isCallExpression(): boolean {
    return this.arguments != null;
  }

  async tokenEvaluatePromise(scope: FormatStringScope) {
    return scope.evaluateFunctionExpression(this.expression);
  }

  /**
   * Generate a constant token expression from function token expression.
   * @param {boolean} [includeEscapeTags] if "{" and "}" format string escape tags should be included or not
   */
  toConstant(includeEscapeTags: boolean = false): ConstantTokenExpression {
    let constantExpression = `${FunctionTokenExpression.PREFIX}${this.expression}`;
    if (includeEscapeTags) {
      constantExpression = '{' + constantExpression + '}';
    }
    return new ConstantTokenExpression({ expression: constantExpression, start: this.start });
  }

  stringify() {
    if (!this.isCallExpression()) {
      return this.expression;
    }
    const argStrings = this.arguments.map((arg) => arg.stringify());
    return `${this.functionName()}(${argStrings.join(', ')})`;
  }

  static trimPrefix(expression: string): string {
    // remove indicator prefix from expression
    expression = expression.trim();
    if (FunctionTokenExpression.hasPrefix(expression)) {
      return expression.slice(FunctionTokenExpression.PREFIX.length);
    }
    return expression;
  }

  static hasPrefix(expression: string): boolean {
    return expression.startsWith(FunctionTokenExpression.PREFIX);
  }
}
