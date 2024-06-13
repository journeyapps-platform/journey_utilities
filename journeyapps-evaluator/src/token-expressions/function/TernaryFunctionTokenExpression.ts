import { TokenExpression } from '../TokenExpression';
import { FunctionTokenExpression, FunctionTokenExpressionOptions } from './FunctionTokenExpression';

export interface TernaryFunctionTokenExpressionOptions
  extends Omit<FunctionTokenExpressionOptions, 'name' | 'arguments'> {
  // Expects exactly 3; test ? consequent : alternate
  arguments: TokenExpression[];
}

export class TernaryFunctionTokenExpression extends FunctionTokenExpression<TernaryFunctionTokenExpressionOptions> {
  constructor(options: TernaryFunctionTokenExpressionOptions) {
    super({ ...options });
    this.setFunctionName('');
  }

  stringify(): string {
    const [test, consequent, alternate] = this.arguments;
    return `${test.stringify()} ? ${consequent.stringify()} : ${alternate.stringify()}`;
  }

  clone(): this {
    return new TernaryFunctionTokenExpression({
      ...this.options,
      arguments: this.arguments.map((arg) => arg.clone())
    }) as this;
  }
}
