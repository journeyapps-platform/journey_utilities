import { FunctionExpressionContext } from '../context/FunctionExpressionContext';
import { FunctionTokenExpression } from '../token-expressions';
import { SourceTransformer } from './SourceTransformer';

export class FunctionSpecifierTransformer extends SourceTransformer {
  static TYPE = 'function-specifier-transformer';
  constructor() {
    super(FunctionExpressionContext.TYPE);
  }

  transform(source: string): string {
    // remove indicator prefix from expression
    const trimmed = source.trim();
    if (trimmed.startsWith(FunctionTokenExpression.PREFIX)) {
      return trimmed.slice(FunctionTokenExpression.PREFIX.length);
    }
    return trimmed;
  }
}
