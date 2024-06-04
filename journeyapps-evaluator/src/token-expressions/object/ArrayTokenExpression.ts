import { FormatStringScope } from '../../definitions/FormatStringScope';
import { TokenExpression, TokenExpressionOptions } from '../TokenExpression';

export interface ArrayExpressionTokenOptions extends TokenExpressionOptions {
  elements: TokenExpression[];
}

export class ArrayTokenExpression extends TokenExpression {
  static readonly TYPE = 'array-expression';

  constructor(options: ArrayExpressionTokenOptions) {
    super(ArrayTokenExpression.TYPE, options);
  }

  async tokenEvaluatePromise(scope: FormatStringScope) {
    return scope.evaluateFunctionExpression(this.expression);
  }
}
