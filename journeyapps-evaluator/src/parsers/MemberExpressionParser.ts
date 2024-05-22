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
    const exp = source.slice(node.start, node.end);

    if (inFunctionExpression(node)) {
      return new FunctionTokenExpression(exp);
    }
    const format: string = node.extra?.format as string;
    if (!!format) {
      return new FormatShorthandTokenExpression(exp, { format: format });
    }
    return new ShorthandTokenExpression(exp);
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
