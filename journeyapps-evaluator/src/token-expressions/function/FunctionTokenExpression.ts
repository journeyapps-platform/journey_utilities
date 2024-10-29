import { FunctionExpressionContext } from '../../context/FunctionExpressionContext';
import { TokenExpressionParser } from '../../TokenExpressionParser';
import { TokenExpression, TokenExpressionOptions } from '../TokenExpression';
import { ConstantTokenExpression } from '../constant/ConstantTokenExpression';
import { FormatStringScope } from '../../definitions/FormatStringScope';

export interface FunctionTokenExpressionOptions extends TokenExpressionOptions {
  name?: string;
  arguments?: TokenExpression[];

  /**
   * Used for non-call expressions to store properties.
   * Example: `$:object.property` or `$:view.user['name']`
   */
  properties?: TokenExpression[];
}

export class FunctionTokenExpression<
  T extends FunctionTokenExpressionOptions = FunctionTokenExpressionOptions
> extends TokenExpression<T> {
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

  constructor(options: T) {
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
    if (this.isCallExpression()) {
      const argStrings = this.arguments.map((arg) => arg.stringify());
      return `${this.functionName()}(${argStrings.join(', ')})`;
    }
    return this.expression;
  }

  clone(): this {
    return new FunctionTokenExpression({
      ...this.options,
      arguments: this.arguments != null ? [...this.arguments.map((a) => a.clone())] : undefined
    }) as this;
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
