import { MemberExpression } from '@babel/types';
import { FunctionExpressionContext } from '../context/FunctionExpressionContext';
import {
  FormatShorthandTokenExpression,
  FunctionTokenExpression,
  ShorthandTokenExpression
} from '../token-expressions';
import {
  AbstractExpressionParser,
  ExpressionParserFactory,
  ExpressionNodeParseEvent
} from './AbstractExpressionParser';

export type MemberExpressionParsedType =
  | FunctionTokenExpression
  | ShorthandTokenExpression
  | FormatShorthandTokenExpression;

export class MemberExpressionParser extends AbstractExpressionParser<MemberExpression, MemberExpressionParsedType> {
  parse(event: ExpressionNodeParseEvent<MemberExpression>) {
    const { node, source, context } = event;
    const expr = source.slice(node.start, node.end);

    if (FunctionExpressionContext.isInstanceOf(context)) {
      return new FunctionTokenExpression({ expression: expr });
    }
    const format: string = node.extra?.format as string;
    return format != null
      ? new FormatShorthandTokenExpression({ expression: expr, format: format })
      : new ShorthandTokenExpression({ expression: expr });
  }
}

export class MemberExpressionParserFactory extends ExpressionParserFactory<MemberExpressionParser> {
  constructor() {
    super('MemberExpression');
  }
  getParser() {
    return new MemberExpressionParser();
  }
}
