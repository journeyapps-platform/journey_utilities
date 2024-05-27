import { FunctionTokenExpression } from '../token-expressions';
import { FunctionSpecifierTransformer } from '../transformers/FunctionSpecifierTransformer';
import { ParseContext, ParseContextFactory } from './ParseContext';

export class FunctionExpressionContext extends ParseContext {
  static TYPE = 'function-expression-context';

  static isInstanceOf(context: ParseContext | null): context is FunctionExpressionContext {
    return context?.type === FunctionExpressionContext.TYPE;
  }

  constructor() {
    super(FunctionExpressionContext.TYPE, { transformers: [new FunctionSpecifierTransformer()] });
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
