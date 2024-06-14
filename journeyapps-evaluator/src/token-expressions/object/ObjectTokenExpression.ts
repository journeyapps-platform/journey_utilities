import { FormatStringScope } from '../../definitions/FormatStringScope';
import { TokenExpression, TokenExpressionOptions } from '../TokenExpression';

export interface ObjectExpressionTokenOptions extends TokenExpressionOptions {
  properties: Record<string, TokenExpression>;
}

/**
 * Expression that represents an object literal.
 * Example {a: user.name, b: "foo"}
 */
export class ObjectTokenExpression extends TokenExpression<ObjectExpressionTokenOptions, object> {
  static readonly TYPE = 'object-expression';
  constructor(options: ObjectExpressionTokenOptions) {
    super(ObjectTokenExpression.TYPE, options);
  }

  get properties(): Record<string, TokenExpression> {
    return this.options.properties;
  }

  async tokenEvaluatePromise(scope: FormatStringScope) {
    return scope.evaluateFunctionExpression(this.expression);
  }

  clone(): this {
    const cloneProps = Object.fromEntries(Object.entries(this.properties).map(([key, value]) => [key, value.clone()]));
    return new ObjectTokenExpression({ ...this.options, properties: cloneProps }) as this;
  }
}
