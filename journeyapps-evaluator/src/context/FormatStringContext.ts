import { isAssignmentExpression, isExpressionStatement, isStringLiteral, Statement } from '@babel/types';
import { BlockStatementTransformer, FormatSpecifierTransformer } from '../transformers';
import { ParseContext, ParseContextFactory } from './ParseContext';

export class FormatStringContext extends ParseContext {
  static readonly TYPE = 'format-string-context';

  static isInstanceOf(context: ParseContext | null): context is FormatStringContext {
    return context?.type === FormatStringContext.TYPE;
  }

  constructor() {
    super(FormatStringContext.TYPE, {
      transformers: [new FormatSpecifierTransformer(), new BlockStatementTransformer()]
    });
  }

  getFormatSpecifier(stm: Statement | null): string | null {
    if (!isExpressionStatement(stm)) {
      return null;
    }
    const { expression } = stm;
    if (!isAssignmentExpression(expression)) {
      return null;
    }
    return isStringLiteral(expression.right) ? expression.right.value : null;
  }
}

export class FormatStringContextFactory extends ParseContextFactory<FormatStringContext> {
  inferParseContext(source: string): FormatStringContext | null {
    const trimmed = source.trim();
    // Check if the source is enclosed in curly braces and not in double curly braces
    if (trimmed.indexOf('{') === 0 && trimmed.lastIndexOf('}') === trimmed.length - 1) {
      if (trimmed.charAt(1) != '{') {
        return new FormatStringContext();
      }
    }

    return null;
  }
}
