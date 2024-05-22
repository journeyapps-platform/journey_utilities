import { isType, MemberExpression } from '@babel/types';
import { FormatShorthandTokenExpression, ShorthandTokenExpression } from '../token-expressions';
import { AbstractExpressionParser, ExpressionParserFactory, ExpressionNodeEvent } from './AbstractExpressionParser';

export class MemberExpressionParser extends AbstractExpressionParser<MemberExpression, ShorthandTokenExpression> {
  parse(event: ExpressionNodeEvent<MemberExpression>) {
    const { node, source } = event;
    const exp = source.slice(node.start, node.end);
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
