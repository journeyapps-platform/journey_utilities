import { TokenExpression } from '../TokenExpression';
import { FunctionTokenExpression, FunctionTokenExpressionOptions } from './FunctionTokenExpression';

export interface TernaryFunctionTokenExpressionOptions
  extends Omit<FunctionTokenExpressionOptions, 'name' | 'arguments'> {
  test: TokenExpression;
  consequent: TokenExpression;
  alternate: TokenExpression;
}

export class TernaryFunctionTokenExpression extends FunctionTokenExpression {
  constructor(options: TernaryFunctionTokenExpressionOptions) {
    super({ ...options, arguments: [options.test, options.consequent, options.alternate] });
  }

  stringify(): string {
    const [test, consequent, alternate] = this.arguments;
    return `${test.stringify()} ? ${consequent.stringify()} : ${alternate.stringify()}`;
  }
}
