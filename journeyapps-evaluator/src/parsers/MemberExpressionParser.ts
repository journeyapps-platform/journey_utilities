import { MemberExpression } from '@babel/types';
import {
  FormatShorthandTokenExpression,
  FunctionTokenExpression,
  ShorthandTokenExpression
} from '../token-expressions';
import { AbstractExpressionParser, ExpressionParserFactory, ExpressionNodeEvent } from './AbstractExpressionParser';
import { inFunctionExpression } from './utils';

export type MemberExpressionParsedType =
  | FunctionTokenExpression
  | ShorthandTokenExpression
  | FormatShorthandTokenExpression;

export class MemberExpressionParser extends AbstractExpressionParser<MemberExpression, MemberExpressionParsedType> {
  parse(event: ExpressionNodeEvent<MemberExpression>) {
    const { node, source } = event;
    const expr = source.slice(node.start, node.end);

    if (inFunctionExpression(node)) {
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
