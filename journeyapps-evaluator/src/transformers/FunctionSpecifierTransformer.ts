import { FunctionExpressionContext } from '../context/FunctionExpressionContext';
import { FunctionTokenExpression } from '../token-expressions';
import { SourceTransformer } from './SourceTransformer';

export class FunctionSpecifierTransformer extends SourceTransformer {
  static TYPE = 'function-specifier-transformer';
  constructor() {
    super(FunctionExpressionContext.TYPE);
  }

  transform(source: string): string {
    return FunctionTokenExpression.trimPrefix(source);
  }
}
