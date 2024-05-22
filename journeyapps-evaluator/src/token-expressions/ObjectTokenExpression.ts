import { FormatStringScope } from '../definitions/FormatStringScope';
import { TokenExpression, TokenExpressionOptions } from './TokenExpression';

export interface ObjectExpressionTokenOptions extends TokenExpressionOptions {
  properties: Record<string, TokenExpression>;
}

/**
 * Expression that represents an object literal.
 * Example {a: user.name, b: "foo"}
 */
export class ObjectTokenExpression extends TokenExpression<ObjectExpressionTokenOptions, object> {
  static TYPE = 'object-expression';
  constructor(options: ObjectExpressionTokenOptions) {
    super(ObjectTokenExpression.TYPE, options);
  }

  get properties(): Record<string, TokenExpression> {
    return this.options.properties;
  }

  async tokenEvaluatePromise(scope: FormatStringScope) {
    return scope.evaluateFunctionExpression(this.expression);
  }
}
