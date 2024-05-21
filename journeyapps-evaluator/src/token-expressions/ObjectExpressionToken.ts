import { FormatStringScope } from '../definitions/FormatStringScope';
import { TokenExpression, TokenExpressionOptions } from './TokenExpression';

export interface ObjectExpressionTokenOptions extends TokenExpressionOptions {
  properties: Record<string, TokenExpression>;
}

/**
 * Expression that represents an object literal.
 * Example {a: user.name, b: "foo"}
 */
export class ObjectExpressionToken extends TokenExpression<ObjectExpressionTokenOptions, object> {
  constructor(expression: string, options: ObjectExpressionTokenOptions) {
    super(expression, options);
  }

  get properties(): Record<string, TokenExpression> {
    return this.options.properties;
  }

  async tokenEvaluatePromise(scope: FormatStringScope) {
    return Promise.resolve({});
  }
}
