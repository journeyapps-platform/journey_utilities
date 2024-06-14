import { FunctionTokenExpression } from '../token-expressions';
import { ParseContext, ParseContextFactory } from './ParseContext';

export class FunctionExpressionContext extends ParseContext {
  static readonly TYPE = 'function-expression-context';

  static isInstanceOf(context: ParseContext | null): context is FunctionExpressionContext {
    return context?.type === FunctionExpressionContext.TYPE;
  }

  constructor() {
    super(FunctionExpressionContext.TYPE);
  }
}

export class FunctionExpressionContextFactory extends ParseContextFactory<FunctionExpressionContext> {
  inferParseContext(source: string): FunctionExpressionContext | null {
    if (FunctionTokenExpression.hasPrefix(source.trim())) {
      return new FunctionExpressionContext();
    }

    return null;
  }
}
